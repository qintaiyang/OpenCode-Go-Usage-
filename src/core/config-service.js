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

function loadConfig() {
  const cfg = readJsonFile(runtimeConfigPath) || {};
  const fileAuth = readTextFile(runtimeAuthPath);
  const auth = process.env.OPENCODE_AUTH || cfg.auth || fileAuth || '';
  const workspaceId = process.env.OPENCODE_WORKSPACE_ID || cfg.workspace_id || DEFAULT_WORKSPACE_ID;

  return {
    auth,
    workspaceId,
    configPath: runtimeConfigPath,
    configDir: getConfigDir(),
    hasAuth: Boolean(auth && !auth.startsWith('Fe26.2**...'))
  };
}

function saveConfig({ auth, workspaceId }) {
  ensureConfigDir();
  const existing = readJsonFile(runtimeConfigPath) || {};
  const next = {
    auth: auth || existing.auth || '',
    workspace_id: workspaceId || existing.workspace_id || DEFAULT_WORKSPACE_ID
  };
  fs.writeFileSync(runtimeConfigPath, JSON.stringify(next, null, 2) + '\n');
  return next;
}

function migrateConfigIfNeeded() {
  ensureConfigDir();
  if (fs.existsSync(runtimeConfigPath)) return false;
  if (!fs.existsSync(PROJECT_CONFIG_PATH)) return false;
  const existing = readJsonFile(PROJECT_CONFIG_PATH);
  if (!existing) return false;
  fs.writeFileSync(runtimeConfigPath, JSON.stringify(existing, null, 2) + '\n');
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
  migrateConfigIfNeeded
};
