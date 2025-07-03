const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Initialize remote module if available
let remote;
try {
  require('@electron/remote/main').initialize();
  remote = require('@electron/remote/main');
} catch (e) {
  console.log('@electron/remote not available, using alternative approach');
}

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      webSecurity: false, // Allow loading local files
    },
  });

  // Enable remote module for this window if available
  if (remote) {
    remote.enable(win.webContents);
  }

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // In development, load from electron-vite dev server
    win.loadURL('http://localhost:5173');
    // Open the DevTools.
    win.webContents.openDevTools();
  } else {
    // In production, load the built files
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function srtToVtt(srtContent) {
  // Add WEBVTT header
  let vtt = 'WEBVTT\n\n';
  // Remove sequence numbers and convert commas to periods in timestamps
  vtt += srtContent
    .replace(/\r/g, '')
    .split('\n')
    .filter(line => !/^\d+$/.test(line))
    .map(line => line.replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4'))
    .join('\n');
  return vtt;
}

// Handle file dialog requests
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error('Error showing open dialog:', error);
    return { canceled: true, filePaths: [] };
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(options);
    return result;
  } catch (error) {
    console.error('Error showing save dialog:', error);
    return { canceled: true, filePath: '' };
  }
});

// Handle file loading requests
ipcMain.handle('load-video-file', async (event, filePath) => {
  try {
    console.log('Main process: Loading video file:', filePath);
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Convert to proper file:// URL with proper encoding
      const normalizedPath = path.normalize(filePath);
      // Use encodeURI to properly encode the file path
      const encodedPath = encodeURI(normalizedPath.replace(/\\/g, '/'));
      const fileUrl = `file:///${encodedPath}`;
      console.log('Main process: Generated file URL:', fileUrl);
      return fileUrl;
    } else {
      console.error('Main process: File does not exist:', filePath);
      throw new Error('File does not exist');
    }
  } catch (error) {
    console.error('Error loading video file:', error);
    throw error;
  }
});

ipcMain.handle('load-subtitle-file', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.srt') {
        // Convert SRT to VTT and serve as data URL
        const srtContent = fs.readFileSync(filePath, 'utf8');
        const vttContent = srtToVtt(srtContent);
        const dataUrl = 'data:text/vtt;charset=utf-8,' + encodeURIComponent(vttContent);
        return dataUrl;
      } else {
        // Use file:// URL for VTT and other supported formats
        const normalizedPath = path.normalize(filePath);
        const encodedPath = encodeURI(normalizedPath.replace(/\\/g, '/'));
        return `file:///${encodedPath}`;
      }
    } else {
      throw new Error('File does not exist');
    }
  } catch (error) {
    console.error('Error loading subtitle file:', error);
    throw error;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());
