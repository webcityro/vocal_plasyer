"use strict";
const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
require("fs");
let remote;
try {
  require("@electron/remote/main").initialize();
  remote = require("@electron/remote/main");
} catch (e) {
  console.log("@electron/remote not available, using alternative approach");
}
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // For simplicity, not recommended for production
      enableRemoteModule: true
      // Enable remote module
    }
  });
  if (remote) {
    remote.enable(win.webContents);
  }
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
