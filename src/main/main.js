const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let remote;
try {
  require('@electron/remote/main').initialize();
  remote = require('@electron/remote/main');
} catch (e) {
  console.log('@electron/remote not available, using alternative approach');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      webSecurity: false, // Allow loading local files
    },
    zoomToPageWidth: true,
    autoHideMenuBar: true,
  });

  if (remote) {
    remote.enable(win.webContents);
  }

  console.log('environment:', process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../out/renderer/index.html'));
  }
}

function srtToVtt(srtContent) {
  let vtt = 'WEBVTT\n\n';
  vtt += srtContent
    .replace(/\r/g, '')
    .split('\n')
    .filter(line => !/^\d+$/.test(line))
    .map(line => line.replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4'))
    .join('\n');
  return vtt;
}

ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    return await dialog.showOpenDialog(options);
  } catch (error) {
    console.error('Error showing open dialog:', error);
    return { canceled: true, filePaths: [] };
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    return await dialog.showSaveDialog(options);
  } catch (error) {
    console.error('Error showing save dialog:', error);
    return { canceled: true, filePath: '' };
  }
});

ipcMain.handle('load-video-file', async (event, filePath) => {
  try {
    console.log('Main process: Loading video file:', filePath);
    if (fs.existsSync(filePath)) {
      const normalizedPath = path.normalize(filePath);
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
        const srtContent = fs.readFileSync(filePath, 'utf8');
        const vttContent = srtToVtt(srtContent);
        return 'data:text/vtt;charset=utf-8,' + encodeURIComponent(vttContent);
      } else {
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
