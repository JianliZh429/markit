const {
  app,
  dialog,
  globalShortcut,
  ipcMain,
  BrowserWindow,
} = require("electron");
require("@electron/remote/main").initialize();

const path = require("path");
const fs = require("fs");
const shortcuts = require("./shortcuts.js");
const menu = require("./menu.js");
const recentFiles = require("./recent-files.js");
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 960,
    height: 720,
    title: "MarkIt",
    webPreferences: {
      enableRemoteModule: true,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });
  require("@electron/remote/main").enable(win.webContents);

  win.loadFile(path.join(__dirname, "../index.html"));
  shortcuts.register(globalShortcut, win, ipcMain);
  menu.initAppMenu(win);
}

app.whenReady().then(createWindow);

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.on("new-file-dialog", async (event) => {
  await dialog
    .showSaveDialog({
      defaultPath: "untitled.md",
      filters: [{ name: "Markdown Files", extensions: ["md"] }],
    })
    .then((result) => {
      if (result) {
        event.reply("new-file-created", result.filePath);
      }
    })
    .catch((err) => console.log(err));
});

ipcMain.on("open-file-dialog", async (event) => {
  await dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Markdown Files", extensions: ["md"] }],
    })
    .then((result) => {
      if (!result.canceled) {
        event.reply("file-opened", result.filePaths);
        recentFiles.add(result.filePaths[0]);
        menu.initAppMenu(win);
      }
    })
    .catch((err) => console.log(err));
});

ipcMain.on("open-folder-dialog", async (event) => {
  await dialog
    .showOpenDialog({
      properties: ["openDirectory"],
    })
    .then((result) => {
      if (!result.canceled) {
        event.reply("file-opened", result.filePaths);
        recentFiles.add(result.filePaths[0]);
        menu.initAppMenu(win);
      }
    })
    .catch((err) => console.log(err));
});

ipcMain.on("save-file-dialog", async (event) => {
  await dialog
    .showSaveDialog({
      defaultPath: "untitled.md",
      filters: [{ name: "Markdown Files", extensions: ["md"] }],
    })
    .then((result) => {
      if (result) {
        event.reply("save-file", result.filePath);
      }
    })
    .catch((err) => console.log(err));
});

ipcMain.on("save-file", async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content);
    console.log(`File saved to ${filePath}`);
  } catch (error) {
    console.log(`File failed to save to ${filePath}`);
  }
});
