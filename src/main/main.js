const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');
const {
  loadConfig,
  setConfigPaths,
  getConfigPath,
  migrateConfigIfNeeded
} = require('../core/config-service');
const { fetchUsage } = require('../core/usage-service');
const {
  listAccounts,
  getActiveSafeAccount,
  getAccountOrThrow,
  switchAccount,
  upsertAccount,
  deleteAccount
} = require('../core/account-service');
const {
  CAPABILITIES: API_KEY_CAPABILITIES,
  listApiKeys,
  getApiKeyForCopy,
  createApiKey,
  removeApiKey
} = require('../core/api-key-service');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;
let isQuitting = false;
let hasShownTrayHint = false;

// ============================================================
// Window Creation
// ============================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 460,
    minWidth: 340,
    minHeight: 420,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'OpenCode Go Usage',
    icon: path.join(__dirname, '..', '..', 'assets', 'tray-icon.png'),
    frame: false,
    autoHideMenuBar: true,
    transparent: true,
    backgroundColor: '#00000000',
    backgroundMaterial: 'none',
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: process.platform === 'darwin' ? 'active' : undefined,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.setMenu(null);

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Close → hide to tray (unless quitting)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      showTrayHintOnce();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// Tray
// ============================================================
function createTray() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip('OpenCode Go Usage');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Refresh Usage',
      click: handleTrayRefreshUsage
    },
    {
      label: 'Manual Login',
      click: handleTrayShowLoginPanel
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Left-click tray → show window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function showTrayHintOnce() {
  if (!hasShownTrayHint && tray) {
    hasShownTrayHint = true;
    tray.displayBalloon({
      title: 'OpenCode Go Usage',
      content: 'OpenCode Go Usage is still running in the tray.\nClick the tray icon to reopen it.'
    });
  }
}

// ============================================================
// Tray Menu Handlers
// ============================================================
async function handleTrayRefreshUsage() {
  try {
    const cfg = loadConfig();
    const usage = await fetchUsage({ auth: cfg.auth, workspaceId: cfg.workspaceId });
    if (mainWindow) {
      mainWindow.webContents.send('usage:updated', { ok: true, usage });
    }
  } catch (err) {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.webContents.send('usage:updated', { ok: false, error: err.message });
    }
  }
}

async function handleTrayShowLoginPanel() {
  if (mainWindow) {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.focus();
    mainWindow.webContents.send('auth:show-login-panel');
  }
}

// ============================================================
// IPC Handlers
// ============================================================
ipcMain.handle('usage:get', async () => {
  try {
    const cfg = loadConfig();
    if (!cfg.accountId) {
      throw new Error('No account configured. Please add an account.');
    }
    const usage = await fetchUsage({ auth: cfg.auth, workspaceId: cfg.workspaceId });
    return { ok: true, usage, account: getActiveSafeAccount() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ============================================================
// Account IPC Handlers
// ============================================================

ipcMain.handle('accounts:list', () => {
  try {
    return { ok: true, ...listAccounts() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('accounts:switch', async (_event, accountId) => {
  try {
    const account = switchAccount(String(accountId || ''));
    const cfg = loadConfig();
    const usage = cfg.hasAuth
      ? await fetchUsage({ auth: cfg.auth, workspaceId: cfg.workspaceId })
      : null;
    return { ok: true, account, usage };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('accounts:save', async (_event, payload) => {
  try {
    const input = payload || {};
    const account = upsertAccount({
      id: input.id,
      name: input.name,
      workspaceId: input.workspaceId
    });
    return { ok: true, account };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('accounts:delete', (_event, accountId) => {
  try {
    return { ok: true, ...deleteAccount(String(accountId || '')) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ============================================================
// API Key IPC Handlers
// ============================================================

ipcMain.handle('api-keys:capabilities', () => {
  return { ok: true, capabilities: API_KEY_CAPABILITIES };
});

ipcMain.handle('api-keys:list', async (_event, accountId) => {
  try {
    const { account } = getAccountOrThrow(accountId);
    const keys = await listApiKeys({ auth: account.auth, workspaceId: account.workspaceId });
    return { ok: true, keys };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('api-keys:copy', async (_event, payload) => {
  try {
    const { accountId, keyId } = payload || {};
    const { account } = getAccountOrThrow(accountId);
    const key = await getApiKeyForCopy({ auth: account.auth, workspaceId: account.workspaceId, keyId });
    require('electron').clipboard.writeText(key);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('api-keys:create', async (_event, payload) => {
  try {
    const { accountId, name } = payload || {};
    const { account } = getAccountOrThrow(accountId);
    const created = await createApiKey({ auth: account.auth, workspaceId: account.workspaceId, name });
    if (created && created.key) {
      require('electron').clipboard.writeText(created.key);
    }
    return {
      ok: true,
      key: created
        ? {
          id: created.id,
          name: created.name,
          keyDisplay: created.keyDisplay || (created.key ? `${created.key.slice(0, 7)}...${created.key.slice(-4)}` : ''),
          email: created.email || '',
          hasFullKey: Boolean(created.key),
          copiedToClipboard: Boolean(created.key)
        }
        : null
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('api-keys:remove', async (_event, payload) => {
  try {
    const { accountId, keyId } = payload || {};
    const { account } = getAccountOrThrow(accountId);
    await removeApiKey({ auth: account.auth, workspaceId: account.workspaceId, keyId });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ============================================================
// Auth Helpers
// ============================================================

function getOpenCodeWorkspaceUrl() {
  const cfg = loadConfig();
  return `https://opencode.ai/workspace/${cfg.workspaceId}/go`;
}

function normalizeAuthCookie(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    throw new Error('Please paste the auth cookie.');
  }

  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  // Find the most relevant line: prefer one containing 'auth=', then Cookie: header, then first Fe26. line
  let candidateLine = lines.find((line) => /(^|;\s*|=)auth=/i.test(line));
  if (!candidateLine) candidateLine = lines.find((line) => /^cookie\s*:/i.test(line));
  if (!candidateLine) candidateLine = lines[0];

  // Strip 'Cookie:' prefix
  const text = candidateLine.replace(/^cookie\s*:\s*/i, '').trim();

  let auth = '';

  // auth=value (direct or within semicolon-separated pairs)
  if (/(^|;\s*)auth=/i.test(text)) {
    const match = text.match(/(?:^|;\s*)auth=([^;]+)/i);
    auth = match ? match[1].trim() : '';
  } else if (text.startsWith('Fe26.')) {
    auth = text;
  } else {
    // Try matching a tab-separated DevTools row: "auth  <value>  ..."
    const fields = text.split(/\s+/);
    if (fields[0] === 'auth' && fields[1]) {
      auth = fields[1].trim();
    }
  }

  if (!auth.startsWith('Fe26.')) {
    throw new Error('Invalid auth cookie. It must start with Fe26.');
  }
  if (/\s/.test(auth)) {
    throw new Error('Invalid auth cookie. Remove extra copied fields and try again.');
  }
  if (auth.length < 120) {
    throw new Error('Auth cookie looks truncated. Please copy the full auth value.');
  }
  if (!auth.includes('*')) {
    throw new Error('The auth cookie format is incomplete. Copy the full Value from the browser.');
  }
  if (auth.includes('...') || auth.startsWith('*****')) {
    throw new Error('Auth cookie is masked. Please copy the real value from the browser.');
  }

  return auth;
}

ipcMain.handle('auth:open-browser-login', async () => {
  const url = getOpenCodeWorkspaceUrl();
  await shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle('auth:save-cookie', async (_event, params) => {
  try {
    // Support both old string format and new object format
    const rawCookie = typeof params === 'string' ? params : params?.rawCookie;
    const requestedAccountId = typeof params === 'string' ? '' : params?.accountId;
    const name = typeof params === 'string' ? '' : params?.name;
    const wid = (typeof params === 'string' ? '' : params?.workspaceId) || loadConfig().workspaceId;

    const auth = normalizeAuthCookie(rawCookie);

    // Validate before saving. Do not overwrite a working cookie with a bad one.
    const usage = await fetchUsage({ auth, workspaceId: wid });

    const account = upsertAccount({
      id: requestedAccountId,
      name,
      workspaceId: wid,
      auth
    });
    switchAccount(account.id);

    return {
      ok: true,
      usage,
      account,
      preview: `${auth.slice(0, 8)}...${auth.slice(-4)}`,
      length: auth.length
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('app:hide', () => {
  if (mainWindow) {
    mainWindow.hide();
    showTrayHintOnce();
  }
});

ipcMain.handle('app:open-config-folder', () => {
  shell.showItemInFolder(getConfigPath());
});

// ============================================================
// Runtime Config
// ============================================================
function initializeRuntimeConfig() {
  const userDataDir = app.getPath('userData');
  setConfigPaths({
    configPath: path.join(userDataDir, 'config.json'),
    authPath: path.join(userDataDir, '.opencode_auth')
  });
  migrateConfigIfNeeded();
}

// ============================================================
// App Lifecycle
// ============================================================
app.whenReady().then(() => {
  initializeRuntimeConfig();
  Menu.setApplicationMenu(null);
  createTray();
  createWindow();
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  // On Windows, don't quit unless isQuitting is set
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
