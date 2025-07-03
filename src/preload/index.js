// Preload script for electron-vite
// This is required by electron-vite but we don't need it for this app
console.log('Preload script loaded')

const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  loadVideoFile: (filePath) => ipcRenderer.invoke('load-video-file', filePath),
  loadSubtitleFile: (filePath) => ipcRenderer.invoke('load-subtitle-file', filePath)
})
