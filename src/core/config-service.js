const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..', '..');
const PROJECT_CONFIG_PATH = path.join(PROJECT_DIR, 'config.json');
const PROJECT_AUTH_PATH = path.join(PROJECT_DIR, '.opencode_auth');
// Replace with your own workspace ID from https://opencode.ai/workspace/<id>/go
const DEFAULT_WORKSPACE_ID = 'wrk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

let runtimeConfigPath = PROJECT_CONFIG_PATH;
let runtimeAuthPath = PROJECT_AUTH_PATH;

function setConfigPaths({ configPath, authPath } = {}) {
  if (configPath) runtimeConfigPath = configPath;
  if (authPath) runtimeAuthPath = authPath;
}

function getConfigPath() {
  return runtimeConfigPath;
}

function getConfigDir() {
  return path.dirname(runtimeConfigPath);
}

function ensureConfigDir() {
  fs.mkdirSync(getConfigDir(), { recursive: true });
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readTextFile(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8').trim();
}

// ============================================================
// Account Normalization Helpers
// ============================================================

function nowIso() {
  return new Date().toISOString();
}

function createAccountId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.random().toString(16).slice(2, 10);
  return `acc_${stamp}_${rand}`;
}

function sanitizeAccountName(name, fallback) {
  const value = String(name || '').trim();
  return value || fallback || 'Account';
}

function isLegacyConfig(cfg) {
  return !!cfg && !Array.isArray(cfg.accounts) && (cfg.auth || cfg.workspace_id);
}

function normalizeAccount(raw, fallbackName) {
  const createdAt = raw.createdAt || nowIso();
  return {
    id: String(raw.id || createAccountId()),
    name: sanitizeAccountName(raw.name, fallbackName),
    workspaceId: String(raw.workspaceId || raw.workspace_id || DEFAULT_WORKSPACE_ID).trim(),
    auth: String(raw.auth || '').trim(),
    createdAt,
    updatedAt: raw.updatedAt || createdAt
  };
}

function normalizeAppConfig(raw) {
  const cfg = raw || {};

  if (isLegacyConfig(cfg)) {
    const account = normalizeAccount({
      id: 'acc_legacy',
      name: 'Main',
      workspaceId: cfg.workspace_id,
      auth: cfg.auth
    }, 'Main');

    return {
      activeAccountId: account.id,
      accounts: [account]
    };
  }

  const accounts = Array.isArray(cfg.accounts)
    ? cfg.accounts.map((account, index) => normalizeAccount(account, `Account ${index + 1}`))
    : [];

  const activeAccountId = accounts.some((account) => account.id === cfg.activeAccountId)
    ? cfg.activeAccountId
    : (accounts[0] ? accounts[0].id : '');

  return { activeAccountId, accounts };
}

function toSafeAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    workspaceId: account.workspaceId,
    hasAuth: Boolean(account.auth && !account.auth.startsWith('Fe26.2**...')),
    authPreview: account.auth ? `${account.auth.slice(0, 8)}...${account.auth.slice(-4)}` : '',
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

// ============================================================
// App Config (multi-account) Load/Save
// ============================================================

function loadAppConfig() {
  const raw = readJsonFile(runtimeConfigPath) || {};
  const normalized = normalizeAppConfig(raw);

  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    ensureConfigDir();
    fs.writeFileSync(runtimeConfigPath, JSON.stringify(normalized, null, 2) + '\n');
  }

  return {
    ...normalized,
    configPath: runtimeConfigPath,
    configDir: getConfigDir()
  };
}

function getActiveAccount(appConfig) {
  return appConfig.accounts.find((account) => account.id === appConfig.activeAccountId) || null;
}

function saveAppConfig(appConfig) {
  ensureConfigDir();
  const normalized = normalizeAppConfig(appConfig);
  fs.writeFileSync(runtimeConfigPath, JSON.stringify(normalized, null, 2) + '\n');
  return normalized;
}

// ============================================================
// Legacy Backward-Compatible Load/Save
// ============================================================

function loadConfig() {
  const appConfig = loadAppConfig();
  const active = getActiveAccount(appConfig);
  const fileAuth = readTextFile(runtimeAuthPath);
  const auth = process.env.OPENCODE_AUTH || (active && active.auth) || fileAuth || '';
  const workspaceId = process.env.OPENCODE_WORKSPACE_ID || (active && active.workspaceId) || DEFAULT_WORKSPACE_ID;

  return {
    auth,
    workspaceId,
    accountId: active ? active.id : '',
    accountName: active ? active.name : '',
    configPath: runtimeConfigPath,
    configDir: getConfigDir(),
    hasAuth: Boolean(auth && !auth.startsWith('Fe26.2**...'))
  };
}

function saveConfig({ auth, workspaceId }) {
  const appConfig = loadAppConfig();
  let active = getActiveAccount(appConfig);

  if (!active) {
    active = normalizeAccount({
      id: createAccountId(),
      name: 'Main',
      workspaceId: workspaceId || DEFAULT_WORKSPACE_ID,
      auth: auth || ''
    }, 'Main');
    appConfig.accounts.push(active);
    appConfig.activeAccountId = active.id;
  }

  active.auth = auth || active.auth || '';
  active.workspaceId = workspaceId || active.workspaceId || DEFAULT_WORKSPACE_ID;
  active.updatedAt = nowIso();

  return saveAppConfig(appConfig);
}

// ============================================================
// Project Config Migration
// ============================================================

function migrateConfigIfNeeded() {
  ensureConfigDir();
  if (fs.existsSync(runtimeConfigPath)) return false;
  if (!fs.existsSync(PROJECT_CONFIG_PATH)) return false;
  const existing = readJsonFile(PROJECT_CONFIG_PATH);
  if (!existing) return false;
  // Wrap legacy config in new format on migration
  const normalized = normalizeAppConfig(existing);
  fs.writeFileSync(runtimeConfigPath, JSON.stringify(normalized, null, 2) + '\n');
  return true;
}

module.exports = {
  PROJECT_DIR,
  PROJECT_CONFIG_PATH,
  PROJECT_AUTH_PATH,
  DEFAULT_WORKSPACE_ID,
  setConfigPaths,
  getConfigPath,
  getConfigDir,
  loadConfig,
  saveConfig,
  loadAppConfig,
  saveAppConfig,
  getActiveAccount,
  toSafeAccount,
  createAccountId,
  normalizeAccount,
  migrateConfigIfNeeded
};
