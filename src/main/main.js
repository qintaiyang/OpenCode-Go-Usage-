const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');
const {
  loadConfig,
  saveConfig,
  setConfigPaths,
  getConfigPath,
  migrateConfigIfNeeded
} = require('../core/config-service');
const { fetchUsage } = require('../core/usage-service');

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
    const usage = await fetchUsage({ auth: cfg.auth, workspaceId: cfg.workspaceId });
    return { ok: true, usage };
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
    const wid = params?.workspaceId || loadConfig().workspaceId;

    const auth = normalizeAuthCookie(rawCookie);

    // Validate before saving. Do not overwrite a working cookie with a bad one.
    const usage = await fetchUsage({ auth, workspaceId: wid });

    saveConfig({ auth, workspaceId: wid });

    return {
      ok: true,
      usage,
      preview: `${auth.slice(0, 8)}...${auth.slice(-4)}`,
      length: auth.length
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('auth:save-workspace-id', async (_event, workspaceId) => {
  try {
    const wid = String(workspaceId || '').trim();
    if (!wid) throw new Error('Workspace ID is required.');
    if (!wid.startsWith('wrk_')) throw new Error('Workspace ID must start with wrk_.');

    const cfg = loadConfig();
    if (cfg.auth) {
      // Validate by testing with current auth
      await fetchUsage({ auth: cfg.auth, workspaceId: wid });
    }
    saveConfig({ auth: cfg.auth, workspaceId: wid });

    return { ok: true, workspaceId: wid };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('config:get', () => {
  const cfg = loadConfig();
  return {
    workspaceId: cfg.workspaceId,
    hasAuth: cfg.hasAuth
  };
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
