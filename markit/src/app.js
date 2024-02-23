const { app, BrowserWindow } = require("electron");
require("./app-menu");
function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    webPreferences: {
      enableRemoteModule: true,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  win.loadFile("../index.html");
}

app.whenReady().then(createWindow);
