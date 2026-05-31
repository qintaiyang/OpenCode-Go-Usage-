#!/usr/bin/env node
const path = require('path');
const { setConfigPaths, loadConfig } = require('../src/core/config-service');
const { fetchUsage } = require('../src/core/usage-service');

// The development app currently stores runtime config under %APPDATA%\opencode-go.
// If the packaged productName changes Electron userData, override with OPENCODE_GO_CONFIG_DIR.
function getRuntimeConfigDir() {
  if (process.env.OPENCODE_GO_CONFIG_DIR) {
    return process.env.OPENCODE_GO_CONFIG_DIR;
  }

  const appData = process.env.APPDATA;
  if (!appData) {
    throw new Error('APPDATA is not set. Set OPENCODE_GO_CONFIG_DIR to the app config directory.');
  }

  return path.join(appData, 'opencode-go');
}

const configDir = getRuntimeConfigDir();
const configPath = path.join(configDir, 'config.json');
const authPath = path.join(configDir, '.opencode_auth');

setConfigPaths({ configPath, authPath });

(async () => {
  const cfg = loadConfig();
  console.log(`configDir=${configDir}`);
  console.log(`configPath=${cfg.configPath}`);
  console.log(`workspaceId=${cfg.workspaceId}`);
  console.log(`hasAuth=${cfg.hasAuth}`);
  console.log(`authLength=${cfg.auth ? cfg.auth.length : 0}`);
  console.log(`authPreview=${cfg.auth ? `${cfg.auth.slice(0, 8)}...${cfg.auth.slice(-4)}` : ''}`);

  const usage = await fetchUsage({ auth: cfg.auth, workspaceId: cfg.workspaceId });
  console.log(JSON.stringify(usage.summary, null, 2));
  console.log(`records=${usage.detail.count}`);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
