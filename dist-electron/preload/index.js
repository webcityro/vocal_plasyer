"use strict";
console.log("Preload script loaded");
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  loadVideoFile: (filePath) => ipcRenderer.invoke("load-video-file", filePath),
  loadSubtitleFile: (filePath) => ipcRenderer.invoke("load-subtitle-file", filePath)
});
