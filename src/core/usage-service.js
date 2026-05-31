const HASH = {
  SUMMARY:  "c7389bd0e731f80f49593e5ee53835475f4e28594dd6bd83eb229bab753498cd",
  LIST:     "6262ba54bff26cd7ec162f93db420e0d19df9cd94b2233dfe3b6b24c3f990388",
  REFERRAL: "2a0b2fef5fd2ec9eff0cb5d4955e4ada4eece21fac85591ed4c09630168d4844",
};

const BASE = 'https://opencode.ai';

function encodeArgs(workspaceId) {
  return JSON.stringify({
    t: { t: 9, i: 0, l: 1, a: [{ t: 1, s: workspaceId }], o: 0 },
    f: 31, m: []
  });
}

function isAuthRedirectPayload(text) {
  const value = String(text || '');
  return (
    value.includes('/auth/authorize') &&
    (value.includes('status:302') || value.includes('new Response') || value.includes('location'))
  );
}

async function callAPI(hash, workspaceId, auth) {
  if (!auth || auth.startsWith('Fe26.2**...')) {
    throw new Error('Missing OpenCode auth cookie. Please refresh login.');
  }

  const url = `${BASE}/_server?id=${hash}&args=${encodeURIComponent(encodeArgs(workspaceId))}`;
  const resp = await fetch(url, {
    headers: {
      'Cookie': `auth=${auth}`,
      'X-Server-Id': hash,
      'X-Server-Instance': `fn:${Date.now()}`,
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (resp.status === 401 || resp.status === 403) {
    throw new Error('OpenCode auth expired. Please refresh login.');
  }

  if (!resp.ok) {
    throw new Error(`OpenCode API request failed with HTTP ${resp.status}.`);
  }

  const text = await resp.text();

  if (isAuthRedirectPayload(text)) {
    throw new Error('OpenCode login expired or invalid. Please paste a fresh auth cookie.');
  }

  return text;
}

function parseSummary(raw) {
  const extract = (key) => {
    const re = new RegExp(key + ':\\$R\\[\\d+\\]=\\{status:"(\\w+)",resetInSec:(\\d+).*?usagePercent:(\\d+)\\}');
    const m = raw.match(re);
    return m ? { status: m[1], resetInSec: parseInt(m[2]), usagePercent: parseInt(m[3]) } : null;
  };
  return {
    rolling: extract('rollingUsage'),
    weekly: extract('weeklyUsage'),
    monthly: extract('monthlyUsage'),
    useBalance: raw.includes('useBalance:!0'),
    isMine: raw.includes('mine:!0'),
  };
}

function parseUsageList(raw) {
  const recordCount = (raw.match(/id:"usg_/g) || []).length;
  const costs = [...raw.matchAll(/cost:(\d+)/g)].map(m => parseInt(m[1]));
  const totalCost = costs.reduce((a, b) => a + b, 0);

  const modelMatch = [...raw.matchAll(/model:"([^"]+)"/g)].map(m => m[1]);
  const modelCounts = {};
  modelMatch.forEach(name => { modelCounts[name] = (modelCounts[name] || 0) + 1; });

  const inputTokens = [...raw.matchAll(/inputTokens:(\d+)/g)].map(m => parseInt(m[1]));
  const outputTokens = [...raw.matchAll(/outputTokens:(\d+)/g)].map(m => parseInt(m[1]));
  const reasoningTokens = [...raw.matchAll(/reasoningTokens:(\d+)/g)].map(m => parseInt(m[1]));
  const cacheTokens = [...raw.matchAll(/cacheReadTokens:(\d+)/g)].map(m => parseInt(m[1]));
  const enrichments = [...raw.matchAll(/plan:"(\w+)"/g)].map(m => m[1]);

  return {
    count: recordCount,
    totalCost,
    totalInput: inputTokens.reduce((a, b) => a + b, 0),
    totalOutput: outputTokens.reduce((a, b) => a + b, 0),
    totalReasoning: reasoningTokens.reduce((a, b) => a + b, 0),
    totalCache: cacheTokens.reduce((a, b) => a + b, 0),
    modelCounts,
    plans: [...new Set(enrichments)],
  };
}

function addRemainingPercent(summary) {
  const result = {};
  for (const key of ['rolling', 'weekly', 'monthly']) {
    const block = summary[key];
    if (block) {
      const usedPercent = block.usagePercent;
      result[key] = {
        status: block.status,
        resetInSec: block.resetInSec,
        usedPercent,
        usagePercent: usedPercent,
        remainingPercent: Math.max(0, 100 - usedPercent)
      };
    } else {
      result[key] = null;
    }
  }
  return { ...summary, ...result };
}

function hasValidSummary(summary) {
  return !!(
    (summary.rolling && Number.isFinite(summary.rolling.remainingPercent)) ||
    (summary.weekly && Number.isFinite(summary.weekly.remainingPercent)) ||
    (summary.monthly && Number.isFinite(summary.monthly.remainingPercent))
  );
}

async function fetchUsage({ auth, workspaceId }) {
  const summaryRaw = await callAPI(HASH.SUMMARY, workspaceId, auth);
  const parsed = parseSummary(summaryRaw);
  const summary = addRemainingPercent(parsed);

  if (!hasValidSummary(summary)) {
    throw new Error('No usage data returned. Please verify workspace and auth cookie.');
  }

  const listRaw = await callAPI(HASH.LIST, workspaceId, auth);
  const detail = parseUsageList(listRaw);

  return {
    workspaceId,
    summary,
    detail,
    fetchedAt: new Date().toISOString()
  };
}

module.exports = { fetchUsage };
