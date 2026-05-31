// ============================================================
// i18n - 中文适配
// ============================================================

const LANG = {
  // Status
  'status.loading': '加载中',
  'status.ready': '在线',
  'status.login': '登录',
  'status.error': '错误',
  'status.login-refreshing': '登录中...',
  'status.usage.monitor': '用量监控',
  // Labels
  'account.label': '账户',
  'no.account': '无账户',
  'delete': '删除',
  'copy': '复制',
  'copied': '已复制',
  'refresh': '刷新',
  'login': '登录',
  'new': '新建',
  'config': '配置',
  'keys': '密钥',
  'create': '创建',
  'create.unavailable': '创建不可用',
  'save.cookie': '保存 Cookie',
  'save.account': '保存账户',
  'open.opencode': '打开 OpenCode',
  'new.account': '+ 新建账户',
  'cancel': '取消',
  // Usage cards
  'rolling.remaining': '滚动剩余',
  'weekly': '每周',
  'monthly': '每月',
  'used': '已用',
  'reset': '重置',
  'remaining': '剩余',
  'percent.left': '% 剩余',
  'd': '天',
  'h': '时',
  'm': '分',
  'resets.soon': '即将重置',
  'N/A': 'N/A',
  // Detail
  'records': '条记录',
  'cache': '缓存',
  'no.model.data': '无模型数据',
  'no.api.keys': '暂无 API 密钥',
  'api.key': 'API 密钥',
  'cost': '费用',
  // Account editor
  'edit.account': '编辑账户登录信息和工作区。',
  'new.account.prompt': '添加新账户。粘贴 auth cookie 和工作区 ID。',
  'save.cookie.creates': '保存 Cookie 即可创建新账户。',
  'closing': '关闭',
  'hide.to.tray': '隐藏到托盘',
  'close.api.keys': '关闭 API 密钥',
  // Login panel
  'login.with.browser': '浏览器登录',
  'login.desc': '在浏览器中登录后，粘贴 OpenCode auth cookie。',
  'step.1': '点击打开 OpenCode 并通过 Google 登录。',
  'step.2': '在浏览器中按 F12。',
  'step.3': '打开 Application > Cookies > https://opencode.ai。',
  'step.4': '找到名为 auth 的 cookie。',
  'step.5': '复制其 Value 并粘贴到下方。',
  'workspace.id': '工作区 ID',
  'auth.cookie.placeholder': '粘贴 auth 值或完整 Cookie 头',
  // API Keys overlay
  'api.keys.title': 'API 密钥',
  'new.key.name': '新密钥名称',
  // Messages
  'saving.cookie': '正在保存 Cookie...',
  'saved.success': '已保存 {preview}（{length} 字符）。用量已刷新。',
  'cookie.save.failed': 'Cookie 保存失败。',
  'saving.workspace': '正在保存工作区...',
  'account.saved': '账户已保存：{name}',
  'save.account.failed': '保存账户失败。',
  'workspace.invalid': '工作区 ID 必须以 wrk_ 开头。',
  'browser.opened': '浏览器已打开。登录后复制 auth cookie 值。',
  'unable.open.browser': '无法打开浏览器。',
  'no.account.selected': '未选择账户。',
  'delete.account.confirm': '确定删除账户"{name}"？这将移除该账户保存的 auth cookie。',
  'delete.api.key.confirm': '确定删除 API 密钥"{name}"？',
  'delete.failed': '删除失败。',
  'new.must.save.cookie': '新建账户必须通过保存 Cookie 创建。',
  'cannot.delete.new': '新建账户时无法删除。',
  'login.required': '需要登录。打开 OpenCode 浏览器后粘贴 auth cookie 值。',
  'refresh.failed': '刷新失败。',
  'switch.failed': '切换失败。',
  'create.not.enabled': '创建 API 密钥功能未启用。',
  'create.key.failed': '创建密钥失败。',
  'delete.key.failed': '删除密钥失败。',
  'key.copy.confirm': '已复制',
  // Duration helper
  'reset.at': '重置',
  // Cost
  'cost.label': '费用',
  // Errors
  'auth.expired': 'OpenCode 登录已过期或无效。请粘贴新的 auth cookie。',
};

function t(key, ...args) {
  let str = LANG[key] || key;
  if (args.length > 0) {
    const params = args[0] || {};
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });
  // Title tag
  document.title = 'OpenCode Go ' + t('status.usage.monitor');
}

// ============================================================
// Helpers
// ============================================================

function formatDuration(sec) {
  if (sec == null) return t('N/A');
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}${t('d')} ${h}${t('h')}`;
  if (h > 0) return `${h}${t('h')} ${m}${t('m')}`;
  return m <= 0 ? t('resets.soon') : `${m}${t('m')}`;
}

function formatNumber(n) {
  if (n == null) return '--';
  return n.toLocaleString();
}

function formatCost(cost) {
  if (cost == null) return '--';
  return `CNY ${(cost / 100000).toFixed(2)}`;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCompact(n) {
  if (n == null) return '--';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ============================================================
// Status
// ============================================================

function setStatus(state, message) {
  const pill = document.getElementById('status-pill');
  pill.className = 'status-pill';

  switch (state) {
    case 'loading':
      pill.textContent = t('status.loading');
      pill.classList.add('loading');
      break;
    case 'ready':
      pill.textContent = t('status.ready');
      pill.classList.add('ready');
      break;
    case 'login':
      pill.textContent = message || t('status.login');
      pill.classList.add('login');
      break;
    case 'error':
      pill.textContent = message || t('status.error');
      pill.classList.add('error');
      break;
    case 'login-refreshing':
      pill.textContent = t('status.login-refreshing');
      pill.classList.add('login');
      break;
  }
}

// ============================================================
// Render
// ============================================================

let lastSuccessfulUsage = null;
let lastSuccessfulDetail = null;

// ============================================================
// Account State
// ============================================================

let accountsState = {
  activeAccountId: '',
  accounts: []
};
let accountEditorMode = 'edit';
let editingAccountId = '';

function getActiveAccount() {
  return accountsState.accounts.find((account) => account.id === accountsState.activeAccountId) || null;
}

function renderAccounts(payload) {
  if (!payload || !payload.ok) return;
  accountsState = {
    activeAccountId: payload.activeAccountId || '',
    accounts: payload.accounts || []
  };

  const active = getActiveAccount();
  const label = document.getElementById('account-menu-label');
  const list = document.getElementById('account-menu-list');

  label.textContent = active
    ? (active.name || active.workspaceId || t('account.label'))
    : t('no.account');

  list.innerHTML = '';

  for (const account of accountsState.accounts) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'account-menu-item';
    if (account.id === accountsState.activeAccountId) item.classList.add('active');
    item.dataset.accountId = account.id;
    item.textContent = account.name || account.workspaceId || t('account.label');
    item.addEventListener('click', async () => {
      closeAccountMenu();
      await switchToAccount(account.id);
    });
    list.appendChild(item);
  }
}

async function loadAccounts() {
  const result = await window.opencodeUsage.listAccounts();
  renderAccounts(result);
  return result;
}

// ============================================================
// Account Menu
// ============================================================

function openAccountMenu() {
  const popover = document.getElementById('account-menu-popover');
  const button = document.getElementById('account-menu-button');
  popover.hidden = false;
  button.setAttribute('aria-expanded', 'true');
}

function closeAccountMenu() {
  const popover = document.getElementById('account-menu-popover');
  const button = document.getElementById('account-menu-button');
  popover.hidden = true;
  button.setAttribute('aria-expanded', 'false');
}

function toggleAccountMenu() {
  const popover = document.getElementById('account-menu-popover');
  if (popover.hidden) openAccountMenu();
  else closeAccountMenu();
}

async function switchToAccount(accountId) {
  if (!accountId) return;

  setStatus('loading');
  const result = await window.opencodeUsage.switchAccount(accountId);
  if (result.ok) {
    await loadAccounts();
    if (result.usage) renderUsage(result.usage);
    await loadApiKeys();
    setStatus('ready');
  } else {
    setStatus('error', result.error || t('switch.failed'));
  }
}

// ============================================================
// API Key Overlay
// ============================================================

function showApiKeyOverlay() {
  document.getElementById('api-key-overlay').hidden = false;
  loadApiKeys();
}

function hideApiKeyOverlay() {
  document.getElementById('api-key-overlay').hidden = true;
}

// ============================================================
// Account Editor
// ============================================================

function openAccountEditorForActive(message) {
  accountEditorMode = 'edit';
  const active = getActiveAccount();
  editingAccountId = active ? active.id : '';
  showLoginPanel(message || t('edit.account'));
  syncAccountEditorControls();
}

function openNewAccountEditor() {
  accountEditorMode = 'new';
  editingAccountId = '';

  const panel = document.getElementById('login-panel');
  const nameInput = document.getElementById('account-name-input');
  const widInput = document.getElementById('workspace-id-input');
  const cookieInput = document.getElementById('auth-cookie-input');
  const msg = document.getElementById('login-message');

  panel.hidden = false;
  nameInput.value = '';
  widInput.value = '';
  cookieInput.value = '';
  msg.className = 'login-message';
  msg.textContent = t('new.account.prompt');
  nameInput.focus();
  syncAccountEditorControls();
}

function syncAccountEditorControls() {
  const deleteBtn = document.getElementById('btn-delete-account');
  const saveMetaBtn = document.getElementById('btn-save-account-meta');
  if (!deleteBtn || !saveMetaBtn) return;

  const isNew = accountEditorMode === 'new';
  deleteBtn.hidden = isNew;
  saveMetaBtn.disabled = isNew;
  saveMetaBtn.title = isNew ? t('save.cookie.creates') : '';
}

function renderUsage(usage) {
  if (!usage) return;

  const { summary, detail, workspaceId, fetchedAt } = usage;
  lastSuccessfulUsage = summary;
  lastSuccessfulDetail = detail;

  // Cards
  renderCard('rolling', summary.rolling);
  renderCard('weekly', summary.weekly);
  renderCard('monthly', summary.monthly);

  // Detail strip
  if (detail) {
    const topModel = Object.entries(detail.modelCounts || {})
      .sort((a, b) => b[1] - a[1])[0];
    document.getElementById('detail-model').textContent = topModel
      ? `${topModel[0]}`
      : t('no.model.data');
    document.getElementById('detail-records').textContent = `${formatNumber(detail.count)} ${t('records')}`;
    document.getElementById('detail-cost').textContent = formatCost(detail.totalCost);
    document.getElementById('detail-cache').textContent = `${formatCompact(detail.totalCache)} ${t('cache')}`;
  } else {
    document.getElementById('detail-model').textContent = t('no.model.data');
    document.getElementById('detail-records').textContent = `-- ${t('records')}`;
    document.getElementById('detail-cost').textContent = '--';
    document.getElementById('detail-cache').textContent = `-- ${t('cache')}`;
  }
}

function renderCard(key, data) {
  const card = document.getElementById(`card-${key}`);
  const valueEl = card.querySelector(key === 'rolling' ? '.hero-value' : '.mini-value');
  const usedEl = document.getElementById(`used-${key}`);
  const resetEl = document.getElementById(`reset-${key}`);
  const progressEl = document.getElementById(`progress-${key}`);

  if (!data) {
    valueEl.textContent = t('N/A');
    valueEl.classList.add('unavailable');
    usedEl.textContent = t('N/A');
    resetEl.textContent = t('N/A');
    progressEl.style.width = '0%';
    return;
  }

  const usedPercent = data.usedPercent ?? data.usagePercent ?? 0;
  valueEl.classList.remove('unavailable');
  valueEl.textContent = key === 'rolling'
    ? `${data.remainingPercent}%`
    : `${data.remainingPercent}${t('percent.left')}`;
  usedEl.textContent = `${usedPercent}%`;
  resetEl.textContent = formatDuration(data.resetInSec);
  progressEl.style.width = `${Math.min(usedPercent, 100)}%`;
}

// ============================================================
// Login Panel
// ============================================================

function showLoginPanel(message) {
  const panel = document.getElementById('login-panel');
  const input = document.getElementById('auth-cookie-input');
  const widInput = document.getElementById('workspace-id-input');
  const nameInput = document.getElementById('account-name-input');
  const msg = document.getElementById('login-message');
  panel.hidden = false;
  msg.className = 'login-message';
  msg.textContent = message || '';

  // Populate active account data (skip in new mode)
  const active = accountEditorMode === 'new'
    ? null
    : (editingAccountId
      ? accountsState.accounts.find((account) => account.id === editingAccountId)
      : getActiveAccount());
  if (active) {
    nameInput.value = active.name || '';
    widInput.value = active.workspaceId || '';
  } else {
    nameInput.value = '';
    widInput.value = '';
  }

  input.focus();
  syncAccountEditorControls();
}

function hideLoginPanel() {
  const panel = document.getElementById('login-panel');
  const input = document.getElementById('auth-cookie-input');
  const msg = document.getElementById('login-message');
  panel.hidden = true;
  input.value = '';
  msg.className = 'login-message';
  msg.textContent = '';
  accountEditorMode = 'edit';
  editingAccountId = '';
  syncAccountEditorControls();
}

function setLoginMessage(message, type) {
  const msg = document.getElementById('login-message');
  msg.className = type ? `login-message ${type}` : 'login-message';
  msg.textContent = message || '';
}

// ============================================================
// Error Handling
// ============================================================

function handleError(err) {
  const msg = err.message || String(err);
  if (msg.includes('expired') || msg.includes('invalid') || msg.includes('Missing') || msg.includes('auth')) {
    setStatus('login');
    showLoginPanel(t('login.required'));
  } else {
    setStatus('error', msg);
  }
}

// ============================================================
// Main
// ============================================================

async function loadUsage() {
  setStatus('loading');
  try {
    const result = await window.opencodeUsage.getUsage();
    if (result.ok) {
      renderUsage(result.usage);
      setStatus('ready');
    } else {
      handleError(new Error(result.error));
    }
  } catch (err) {
    handleError(err);
  }
}

async function refreshUsage() {
  setStatus('loading');
  try {
    const result = await window.opencodeUsage.getUsage();
    if (result.ok) {
      renderUsage(result.usage);
      setStatus('ready');
    } else {
      // Keep old data on failure — do not re-render with empty data
      setStatus('error', result.error);
    }
  } catch (err) {
    setStatus('error', err.message || t('refresh.failed'));
  }
}

// ============================================================
// API Key Capabilities
// ============================================================

let apiKeyCapabilities = {
  list: true,
  copy: true,
  create: false,
  remove: false
};

async function loadApiKeyCapabilities() {
  const result = await window.opencodeUsage.getApiKeyCapabilities();
  if (result && result.ok && result.capabilities) {
    apiKeyCapabilities = result.capabilities;
  }

  const nameInput = document.getElementById('api-key-name-input');
  const createBtn = document.getElementById('btn-create-api-key');
  nameInput.disabled = !apiKeyCapabilities.create;
  createBtn.disabled = !apiKeyCapabilities.create;
  nameInput.placeholder = apiKeyCapabilities.create ? t('new.key.name') : t('create.unavailable');
}

// ============================================================
// API Key Rendering
// ============================================================

function renderApiKeys(keys) {
  const list = document.getElementById('api-key-list');
  list.innerHTML = '';

  if (!keys || !keys.length) {
    const empty = document.createElement('div');
    empty.className = 'api-key-empty';
    empty.textContent = t('no.api.keys');
    list.appendChild(empty);
    return;
  }

  for (const key of keys) {
    const row = document.createElement('div');
    row.className = apiKeyCapabilities.remove
      ? 'api-key-row'
      : 'api-key-row no-remove';
    row.dataset.keyId = key.id;

    const label = document.createElement('div');
    label.className = 'api-key-label';
    label.textContent = key.name || t('api.key');

    const display = document.createElement('div');
    display.className = 'api-key-display';
    display.textContent = key.keyDisplay || 'sk-...';

    const copy = document.createElement('button');
    copy.className = 'tiny-btn interactive-button';
    copy.type = 'button';
    copy.textContent = t('copy');
    copy.disabled = key.canCopy === false;
    copy.addEventListener('click', async () => {
      const active = getActiveAccount();
      const result = await window.opencodeUsage.copyApiKey({ accountId: active.id, keyId: key.id });
      setStatus(result.ok ? 'ready' : 'error', result.ok ? t('key.copy.confirm') : result.error);
      if (result.ok) setTimeout(() => setStatus('ready'), 800);
    });

    const remove = document.createElement('button');
    remove.className = 'tiny-btn danger interactive-button';
    remove.type = 'button';
    remove.textContent = t('delete');
    remove.addEventListener('click', async () => {
      const active = getActiveAccount();
      const confirmed = window.confirm(t('delete.api.key.confirm', { name: key.name }));
      if (!confirmed) return;
      const result = await window.opencodeUsage.removeApiKey({ accountId: active.id, keyId: key.id });
      if (result.ok) await loadApiKeys();
      else setStatus('error', result.error || t('delete.key.failed'));
    });

    if (apiKeyCapabilities.remove) {
      row.append(label, display, copy, remove);
    } else {
      row.append(label, display, copy);
    }
    list.appendChild(row);
  }
}

async function loadApiKeys() {
  const active = getActiveAccount();
  if (!active || !active.hasAuth) {
    renderApiKeys([]);
    return;
  }
  const result = await window.opencodeUsage.listApiKeys(active.id);
  if (result.ok) renderApiKeys(result.keys);
  else renderApiKeys([]);
}

// ============================================================
// Event Listeners
// ============================================================

document.getElementById('btn-refresh').addEventListener('click', async () => {
  await refreshUsage();
});

document.getElementById('btn-refresh-login').addEventListener('click', () => {
  openAccountEditorForActive(t('login.required'));
});

document.getElementById('btn-open-browser-login').addEventListener('click', async () => {
  try {
    await window.opencodeUsage.openBrowserLogin();
    setLoginMessage(t('browser.opened'), '');
  } catch (err) {
    setLoginMessage(err.message || t('unable.open.browser'), 'error');
  }
});

document.getElementById('btn-save-cookie').addEventListener('click', async () => {
  const cookieInput = document.getElementById('auth-cookie-input');
  const widInput = document.getElementById('workspace-id-input');
  const nameInput = document.getElementById('account-name-input');
  const value = cookieInput.value.trim();
  const wid = widInput.value.trim();

  try {
    setLoginMessage(t('saving.cookie'), '');
    const active = accountEditorMode === 'new'
      ? null
      : (editingAccountId
        ? accountsState.accounts.find((account) => account.id === editingAccountId)
        : getActiveAccount());
    const name = nameInput.value.trim();
    const result = await window.opencodeUsage.saveAuthCookie({
      accountId: active ? active.id : undefined,
      name: name || undefined,
      rawCookie: value,
      workspaceId: wid || undefined
    });
    if (result.ok) {
      cookieInput.value = '';
      renderUsage(result.usage);
      setStatus('ready');
      accountEditorMode = 'edit';
      editingAccountId = result.account ? result.account.id : '';
      await loadAccounts();
      await loadApiKeys();
      setLoginMessage(t('saved.success', { preview: result.preview, length: result.length }), 'success');
      setTimeout(hideLoginPanel, 700);
    } else {
      setLoginMessage(result.error || t('cookie.save.failed'), 'error');
    }
  } catch (err) {
    setLoginMessage(err.message || t('cookie.save.failed'), 'error');
  }
});

document.getElementById('btn-save-account-meta').addEventListener('click', async () => {
  if (accountEditorMode === 'new') {
    setLoginMessage(t('new.must.save.cookie'), 'error');
    return;
  }
  const active = editingAccountId
    ? accountsState.accounts.find((account) => account.id === editingAccountId)
    : getActiveAccount();
  const name = document.getElementById('account-name-input').value.trim();
  const workspaceId = document.getElementById('workspace-id-input').value.trim();

  if (!workspaceId || !workspaceId.startsWith('wrk_')) {
    setLoginMessage(t('workspace.invalid'), 'error');
    return;
  }

  const result = await window.opencodeUsage.saveAccount({
    id: active ? active.id : undefined,
    name: name || undefined,
    workspaceId
  });

  if (result.ok) {
    await loadAccounts();
    editingAccountId = result.account.id;
    setLoginMessage(t('account.saved', { name: result.account.name }), 'success');
  } else {
    setLoginMessage(result.error || t('save.account.failed'), 'error');
  }
});

document.getElementById('btn-delete-account').addEventListener('click', async () => {
  if (accountEditorMode === 'new') {
    setLoginMessage(t('cannot.delete.new'), 'error');
    return;
  }
  const active = getActiveAccount();
  if (!active) {
    setLoginMessage(t('no.account.selected'), 'error');
    return;
  }

  const confirmed = window.confirm(t('delete.account.confirm', { name: active.name }));
  if (!confirmed) return;

  const result = await window.opencodeUsage.deleteAccount(active.id);
  if (result.ok) {
    await loadAccounts();
    hideLoginPanel();
    await loadUsage();
    await loadApiKeys();
  } else {
    setLoginMessage(result.error || t('delete.failed'), 'error');
  }
});

document.getElementById('btn-login-close').addEventListener('click', hideLoginPanel);

document.getElementById('btn-hide').addEventListener('click', async () => {
  try {
    await window.opencodeUsage.hideToTray();
  } catch (err) {
    // Silently fail - hide to tray is best-effort
  }
});

document.getElementById('account-menu-button').addEventListener('click', toggleAccountMenu);
document.getElementById('account-menu-new').addEventListener('click', () => {
  closeAccountMenu();
  openNewAccountEditor();
});

document.addEventListener('click', (event) => {
  const bar = document.querySelector('.account-bar');
  if (bar && !bar.contains(event.target)) {
    closeAccountMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAccountMenu();
    hideApiKeyOverlay();
  }
});

document.getElementById('btn-open-api-keys').addEventListener('click', showApiKeyOverlay);
document.getElementById('btn-close-api-keys').addEventListener('click', hideApiKeyOverlay);

document.getElementById('btn-new-account').addEventListener('click', () => {
  closeAccountMenu();
  openNewAccountEditor();
});

document.getElementById('btn-config-folder').addEventListener('click', async () => {
  try {
    await window.opencodeUsage.openConfigFolder();
  } catch (err) {
    // Silently fail
  }
});

document.getElementById('btn-refresh-api-keys').addEventListener('click', loadApiKeys);

document.getElementById('btn-create-api-key').addEventListener('click', async () => {
  if (!apiKeyCapabilities.create) {
    setStatus('error', t('create.not.enabled'));
    return;
  }
  const active = getActiveAccount();
  const input = document.getElementById('api-key-name-input');
  const name = input.value.trim();
  if (!active) return;

  const result = await window.opencodeUsage.createApiKey({ accountId: active.id, name });
  if (result.ok) {
    input.value = '';
    await loadApiKeys();
  } else {
    setStatus('error', result.error || t('create.key.failed'));
  }
});

// ============================================================
// Push Updates from Tray
// ============================================================

window.opencodeUsage.onUsageUpdated((payload) => {
  if (payload.ok) {
    renderUsage(payload.usage);
    setStatus('ready');
  } else {
    handleError(new Error(payload.error));
  }
});

window.opencodeUsage.onShowLoginPanel(() => {
  showLoginPanel(t('login.required'));
});

// ============================================================
// Pointer-Aware Highlights
// ============================================================

function setupPointerAwareHighlights() {
  const elements = document.querySelectorAll('.interactive-glass, .interactive-button');

  elements.forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      el.style.setProperty('--mouse-x', `${x}%`);
      el.style.setProperty('--mouse-y', `${y}%`);
    });

    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--mouse-x');
      el.style.removeProperty('--mouse-y');
    });
  });
}

// ============================================================
// Initialize
// ============================================================

setupPointerAwareHighlights();
applyI18n();
loadAccounts()
  .then(() => loadApiKeyCapabilities())
  .then(() => loadUsage())
  .then(() => loadApiKeys())
  .catch((err) => handleError(err));
