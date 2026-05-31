const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('opencodeUsage', {
  getUsage: () => ipcRenderer.invoke('usage:get'),
  hideToTray: () => ipcRenderer.invoke('app:hide'),
  openConfigFolder: () => ipcRenderer.invoke('app:open-config-folder'),
  openBrowserLogin: () => ipcRenderer.invoke('auth:open-browser-login'),
  saveAuthCookie: (params) => ipcRenderer.invoke('auth:save-cookie', params),
  // Account methods
  listAccounts: () => ipcRenderer.invoke('accounts:list'),
  switchAccount: (accountId) => ipcRenderer.invoke('accounts:switch', accountId),
  saveAccount: (payload) => ipcRenderer.invoke('accounts:save', payload),
  deleteAccount: (accountId) => ipcRenderer.invoke('accounts:delete', accountId),
  // API Key methods
  getApiKeyCapabilities: () => ipcRenderer.invoke('api-keys:capabilities'),
  listApiKeys: (accountId) => ipcRenderer.invoke('api-keys:list', accountId),
  copyApiKey: (payload) => ipcRenderer.invoke('api-keys:copy', payload),
  createApiKey: (payload) => ipcRenderer.invoke('api-keys:create', payload),
  removeApiKey: (payload) => ipcRenderer.invoke('api-keys:remove', payload),
  // Push event listeners
  onUsageUpdated: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('usage:updated', listener);
    return () => ipcRenderer.removeListener('usage:updated', listener);
  },
  onShowLoginPanel: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('auth:show-login-panel', listener);
    return () => ipcRenderer.removeListener('auth:show-login-panel', listener);
  }
});
