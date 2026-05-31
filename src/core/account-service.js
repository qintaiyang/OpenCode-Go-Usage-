const {
  loadAppConfig,
  saveAppConfig,
  getActiveAccount,
  toSafeAccount,
  createAccountId,
  normalizeAccount,
  DEFAULT_WORKSPACE_ID
} = require('./config-service');

function listAccounts() {
  const cfg = loadAppConfig();
  return {
    activeAccountId: cfg.activeAccountId,
    accounts: cfg.accounts.map(toSafeAccount)
  };
}

function getActiveSafeAccount() {
  const cfg = loadAppConfig();
  return toSafeAccount(getActiveAccount(cfg));
}

function getAccountOrThrow(accountId) {
  const cfg = loadAppConfig();
  const id = accountId || cfg.activeAccountId;
  const account = cfg.accounts.find((item) => item.id === id);
  if (!account) throw new Error('Account not found.');
  return { cfg, account };
}

function switchAccount(accountId) {
  const cfg = loadAppConfig();
  const account = cfg.accounts.find((item) => item.id === accountId);
  if (!account) throw new Error('Account not found.');
  cfg.activeAccountId = account.id;
  saveAppConfig(cfg);
  return toSafeAccount(account);
}

function upsertAccount({ id, name, workspaceId, auth }) {
  const cfg = loadAppConfig();
  const now = new Date().toISOString();
  let account = id ? cfg.accounts.find((item) => item.id === id) : null;

  if (!account) {
    account = normalizeAccount({
      id: id || createAccountId(),
      name: name || `Account ${cfg.accounts.length + 1}`,
      workspaceId: workspaceId || DEFAULT_WORKSPACE_ID,
      auth: auth || '',
      createdAt: now,
      updatedAt: now
    }, `Account ${cfg.accounts.length + 1}`);
    cfg.accounts.push(account);
    if (!cfg.activeAccountId) cfg.activeAccountId = account.id;
  } else {
    if (name != null) account.name = String(name).trim() || account.name;
    if (workspaceId != null) account.workspaceId = String(workspaceId).trim() || account.workspaceId;
    if (auth != null) account.auth = String(auth).trim();
    account.updatedAt = now;
  }

  saveAppConfig(cfg);
  return toSafeAccount(account);
}

function deleteAccount(accountId) {
  const cfg = loadAppConfig();
  const index = cfg.accounts.findIndex((item) => item.id === accountId);
  if (index === -1) throw new Error('Account not found.');

  const removed = cfg.accounts.splice(index, 1)[0];
  if (cfg.activeAccountId === removed.id) {
    cfg.activeAccountId = cfg.accounts[0] ? cfg.accounts[0].id : '';
  }

  saveAppConfig(cfg);
  return {
    deletedAccountId: removed.id,
    activeAccountId: cfg.activeAccountId,
    accounts: cfg.accounts.map(toSafeAccount)
  };
}

module.exports = {
  listAccounts,
  getActiveSafeAccount,
  getAccountOrThrow,
  switchAccount,
  upsertAccount,
  deleteAccount
};
