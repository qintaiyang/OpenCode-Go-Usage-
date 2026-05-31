#!/usr/bin/env node
const path = require('path');
const { setConfigPaths, loadConfig } = require('../src/core/config-service');
const { listApiKeys } = require('../src/core/api-key-service');

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

(async () => {
  const cfg = loadConfig();
  console.log(`accountId=${cfg.accountId}`);
  console.log(`accountName=${cfg.accountName}`);
  console.log(`workspaceId=${cfg.workspaceId}`);
  console.log(`hasAuth=${cfg.hasAuth}`);
  const keys = await listApiKeys({ auth: cfg.auth, workspaceId: cfg.workspaceId });
  console.log(`keyCount=${keys.length}`);
  for (const key of keys) {
    console.log(`${key.id} name=${key.name} display=${key.keyDisplay} canCopy=${key.canCopy}`);
  }
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
