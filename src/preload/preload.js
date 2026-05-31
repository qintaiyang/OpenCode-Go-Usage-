const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('opencodeUsage', {
  getUsage: () => ipcRenderer.invoke('usage:get'),
  hideToTray: () => ipcRenderer.invoke('app:hide'),
  openConfigFolder: () => ipcRenderer.invoke('app:open-config-folder'),
  openBrowserLogin: () => ipcRenderer.invoke('auth:open-browser-login'),
  saveAuthCookie: (params) => ipcRenderer.invoke('auth:save-cookie', params),
  saveWorkspaceId: (workspaceId) => ipcRenderer.invoke('auth:save-workspace-id', workspaceId),
  getConfig: () => ipcRenderer.invoke('config:get'),
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
