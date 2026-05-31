// ============================================================
// Helpers
// ============================================================

function formatDuration(sec) {
  if (sec == null) return 'N/A';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return m <= 0 ? 'Resets soon' : `${m}m`;
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
      pill.textContent = 'Loading';
      pill.classList.add('loading');
      break;
    case 'ready':
      pill.textContent = 'Live';
      pill.classList.add('ready');
      break;
    case 'login':
      pill.textContent = message || 'Login';
      pill.classList.add('login');
      break;
    case 'error':
      pill.textContent = message || 'Error';
      pill.classList.add('error');
      break;
    case 'login-refreshing':
      pill.textContent = 'Login...';
      pill.classList.add('login');
      break;
  }
}

// ============================================================
// Render
// ============================================================

let lastSuccessfulUsage = null;
let lastSuccessfulDetail = null;

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
      : 'No model data';
    document.getElementById('detail-records').textContent = `${formatNumber(detail.count)} records`;
    document.getElementById('detail-cost').textContent = formatCost(detail.totalCost);
    document.getElementById('detail-cache').textContent = `${formatCompact(detail.totalCache)} cache`;
  } else {
    document.getElementById('detail-model').textContent = 'No model data';
    document.getElementById('detail-records').textContent = '-- records';
    document.getElementById('detail-cost').textContent = '--';
    document.getElementById('detail-cache').textContent = '-- cache';
  }
}

function renderCard(key, data) {
  const card = document.getElementById(`card-${key}`);
  const valueEl = card.querySelector(key === 'rolling' ? '.hero-value' : '.mini-value');
  const usedEl = document.getElementById(`used-${key}`);
  const resetEl = document.getElementById(`reset-${key}`);
  const progressEl = document.getElementById(`progress-${key}`);

  if (!data) {
    valueEl.textContent = 'N/A';
    valueEl.classList.add('unavailable');
    usedEl.textContent = 'N/A';
    resetEl.textContent = 'N/A';
    progressEl.style.width = '0%';
    return;
  }

  const usedPercent = data.usedPercent ?? data.usagePercent ?? 0;
  valueEl.classList.remove('unavailable');
  valueEl.textContent = key === 'rolling'
    ? `${data.remainingPercent}%`
    : `${data.remainingPercent}% left`;
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
  const msg = document.getElementById('login-message');
  panel.hidden = false;
  msg.className = 'login-message';
  msg.textContent = message || '';

  // Populate current workspace ID
  window.opencodeUsage.getConfig().then((cfg) => {
    if (cfg && cfg.workspaceId) {
      widInput.value = cfg.workspaceId;
    }
  }).catch(() => {});

  input.focus();
}

function hideLoginPanel() {
  const panel = document.getElementById('login-panel');
  const input = document.getElementById('auth-cookie-input');
  const msg = document.getElementById('login-message');
  panel.hidden = true;
  input.value = '';
  msg.className = 'login-message';
  msg.textContent = '';
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
    showLoginPanel('Login required. Open OpenCode in your browser, then paste the auth cookie value.');
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
    setStatus('error', err.message || 'Refresh failed.');
  }
}

// ============================================================
// Event Listeners
// ============================================================

document.getElementById('btn-refresh').addEventListener('click', async () => {
  await refreshUsage();
});

document.getElementById('btn-refresh-login').addEventListener('click', () => {
  showLoginPanel('Open OpenCode in your browser, sign in, then paste the auth cookie value.');
});

document.getElementById('btn-open-browser-login').addEventListener('click', async () => {
  try {
    await window.opencodeUsage.openBrowserLogin();
    setLoginMessage('Browser opened. Sign in, then copy the auth cookie Value.', '');
  } catch (err) {
    setLoginMessage(err.message || 'Unable to open browser.', 'error');
  }
});

document.getElementById('btn-save-cookie').addEventListener('click', async () => {
  const cookieInput = document.getElementById('auth-cookie-input');
  const widInput = document.getElementById('workspace-id-input');
  const value = cookieInput.value.trim();
  const wid = widInput.value.trim();

  try {
    setLoginMessage('Saving cookie...', '');
    const result = await window.opencodeUsage.saveAuthCookie({ rawCookie: value, workspaceId: wid || undefined });
    if (result.ok) {
      cookieInput.value = '';
      renderUsage(result.usage);
      setStatus('ready');
      setLoginMessage(`Saved ${result.preview} (${result.length} chars). Usage refreshed.`, 'success');
      setTimeout(hideLoginPanel, 700);
    } else {
      setLoginMessage(result.error || 'Cookie save failed.', 'error');
    }
  } catch (err) {
    setLoginMessage(err.message || 'Cookie save failed.', 'error');
  }
});

document.getElementById('btn-save-workspace-id').addEventListener('click', async () => {
  const widInput = document.getElementById('workspace-id-input');
  const wid = widInput.value.trim();

  try {
    setLoginMessage('Saving workspace ID...', '');
    const result = await window.opencodeUsage.saveWorkspaceId(wid);
    if (result.ok) {
      setLoginMessage(`Workspace ID saved: ${result.workspaceId}`, 'success');
    } else {
      setLoginMessage(result.error || 'Save failed.', 'error');
    }
  } catch (err) {
    setLoginMessage(err.message || 'Save failed.', 'error');
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

document.getElementById('btn-config-folder').addEventListener('click', async () => {
  try {
    await window.opencodeUsage.openConfigFolder();
  } catch (err) {
    // Silently fail
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
  showLoginPanel('Open OpenCode in your browser, sign in, then paste the auth cookie value.');
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
loadUsage();
