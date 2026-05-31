// ============================================================
// API Key Service
// OpenCode API Key list/create/remove via internal _server RPC
// ============================================================

const BASE = 'https://opencode.ai';

const CAPABILITIES = {
  list: true,
  copy: true,
  create: false,
  remove: false
};

const HASH = {
  LIST: 'c22cd964237ba79f2f9b95faa2a14b804f870d1bab49279463379cc6a0fd0c85',
  CREATE: '444825072757feb3b2ec98a3260e2c32488cb05899076c0afb36b9eb5142bc62',
  REMOVE: '48baebd35f970b8dc3a658e6f9cc953efd731a7f8a6376012c9bc1802cec787d'
};

// ============================================================
// Helpers
// ============================================================

function assertAuth(auth) {
  if (!auth || auth.startsWith('Fe26.2**...')) {
    throw new Error('Missing OpenCode auth cookie. Please login first.');
  }
}

function isAuthRedirectPayload(text) {
  const value = String(text || '');
  return (
    value.includes('/auth/authorize') &&
    (value.includes('status:302') || value.includes('new Response') || value.includes('location'))
  );
}

function encodeStringArray(values) {
  return JSON.stringify({
    t: {
      t: 9,
      i: 0,
      l: values.length,
      a: values.map((value) => ({ t: 1, s: String(value) })),
      o: 0
    },
    f: 31,
    m: []
  });
}

function encodeWorkspaceArgs(workspaceId) {
  return encodeStringArray([workspaceId]);
}

function encodeCreateArgs(workspaceId, name) {
  throw new Error('key.create seroval POST body is not implemented yet. Implement Task 2 Step 5 before enabling create.');
}

function encodeRemoveArgs(keyId, workspaceId) {
  return encodeStringArray([keyId, workspaceId]);
}

// ============================================================
// GET call for key.list
// ============================================================

async function callServerGet(hash, workspaceId, auth) {
  assertAuth(auth);
  const url = `${BASE}/_server?id=${hash}&args=${encodeURIComponent(encodeWorkspaceArgs(workspaceId))}`;
  const resp = await fetch(url, {
    headers: {
      Cookie: `auth=${auth}`,
      'X-Server-Id': hash,
      'X-Server-Instance': `fn:${Date.now()}`,
      Accept: '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const text = await resp.text();
  if (resp.status === 401 || resp.status === 403 || isAuthRedirectPayload(text)) {
    throw new Error('OpenCode login expired or invalid. Please paste a fresh auth cookie.');
  }
  if (!resp.ok) {
    throw new Error(`OpenCode API Key request failed with HTTP ${resp.status}.`);
  }
  return text;
}

// ============================================================
// Safe API Key Parser
// ============================================================

function safeKeyPreview(key, keyDisplay) {
  if (keyDisplay) return keyDisplay;
  if (!key) return '';
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

function parseApiKeys(raw) {
  const text = String(raw || '');
  const records = [];
  const idMatches = [...text.matchAll(/id:"(key_[^"]+)"/g)];

  for (const idMatch of idMatches) {
    const start = idMatch.index || 0;
    const end = text.indexOf('}', start);
    const slice = text.slice(start, end === -1 ? start + 1200 : end + 1);

    const id = idMatch[1];
    const name = (slice.match(/name:"([^"]*)"/) || [])[1] || 'API Key';
    const key = (slice.match(/key:"([^"]*)"/) || [])[1] || '';
    const keyDisplay = (slice.match(/keyDisplay:"([^"]*)"/) || [])[1] || '';
    const email = (slice.match(/email:"([^"]*)"/) || [])[1] || '';
    const userID = (slice.match(/userID:"([^"]*)"/) || [])[1] || '';

    records.push({
      id,
      name,
      key,
      keyDisplay: safeKeyPreview(key, keyDisplay),
      email,
      userID
    });
  }

  return records;
}

function sanitizeApiKeyRecord(record) {
  return {
    id: record.id,
    name: record.name,
    keyDisplay: record.keyDisplay,
    email: record.email,
    userID: record.userID,
    canCopy: Boolean(record.key)
  };
}

// ============================================================
// Public API
// ============================================================

async function listApiKeys({ auth, workspaceId }) {
  const raw = await callServerGet(HASH.LIST, workspaceId, auth);
  return parseApiKeys(raw).map(sanitizeApiKeyRecord);
}

async function getApiKeyForCopy({ auth, workspaceId, keyId }) {
  const raw = await callServerGet(HASH.LIST, workspaceId, auth);
  const record = parseApiKeys(raw).find((item) => item.id === keyId);
  if (!record) throw new Error('API Key not found.');
  if (!record.key) throw new Error('Full API Key is not available from the list response.');
  return record.key;
}

async function createApiKey() {
  throw new Error('Create API Key is not enabled until POST seroval form encoding is verified.');
}

async function removeApiKey() {
  throw new Error('Remove API Key is not enabled until POST seroval action encoding is verified.');
}

module.exports = {
  CAPABILITIES,
  listApiKeys,
  getApiKeyForCopy,
  createApiKey,
  removeApiKey,
  parseApiKeys,
  sanitizeApiKeyRecord
};
