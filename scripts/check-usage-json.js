#!/usr/bin/env node
/**
 * JSON usage checker - outputs structured JSON for verification
 */
const { loadConfig } = require('../src/core/config-service');
const { fetchUsage } = require('../src/core/usage-service');

(async () => {
  const cfg = loadConfig();
  const usage = await fetchUsage({ auth: cfg.auth, workspaceId: cfg.workspaceId });
  console.log(JSON.stringify(usage, null, 2));
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
