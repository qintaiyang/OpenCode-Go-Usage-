#!/usr/bin/env node
const path = require('path');
const { setConfigPaths, loadAppConfig, toSafeAccount } = require('../src/core/config-service');

function getRuntimeConfigDir() {
  if (process.env.OPENCODE_GO_CONFIG_DIR) return process.env.OPENCODE_GO_CONFIG_DIR;
  const appData = process.env.APPDATA;
  if (!appData) throw new Error('APPDATA is not set.');
  return path.join(appData, 'opencode-go');
}

const configDir = getRuntimeConfigDir();
setConfigPaths({
  configPath: path.join(configDir, 'config.json'),
  authPath: path.join(configDir, '.opencode_auth')
});

const cfg = loadAppConfig();
console.log(`configDir=${configDir}`);
console.log(`activeAccountId=${cfg.activeAccountId}`);
console.log(`accountCount=${cfg.accounts.length}`);
for (const account of cfg.accounts) {
  const safe = toSafeAccount(account);
  console.log(`${safe.id} name=${safe.name} workspace=${safe.workspaceId} hasAuth=${safe.hasAuth} authPreview=${safe.authPreview}`);
}
