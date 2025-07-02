const { app, BrowserWindow } = require('electron');

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity, not recommended for production
    },
  });

  // Load the index.html of the app.
  win.loadFile('src/index.html');

  // Open the DevTools.
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());