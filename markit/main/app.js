const {
  app,
  dialog,
  globalShortcut,
  ipcMain,
  BrowserWindow,
} = require("electron");
const path = require("path");
const fs = require("fs");

const shortcuts = require("./shortcuts.js");
const menu = require("./menu.js");
require("@electron/remote/main").initialize();
function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    title: "MarkIt",
    webPreferences: {
      enableRemoteModule: true,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  win.loadFile(path.join(__dirname, "../index.html"));
  shortcuts.register(globalShortcut, win, ipcMain);
  menu.initAppMenu(win);
  require("@electron/remote/main").enable(win.webContents);
}

app.whenReady().then(createWindow);

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.on("open-file-directory-dialog", async (event) => {
  await dialog
    .showOpenDialog({
      properties: ["openFile", "openDirectory"],
      filters: [{ name: "Markdown Files", extensions: ["md"] }],
    })
    .then((result) => {
      if (!result.canceled) {
        event.reply("file-opened", result.filePaths);
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

ipcMain.on("renamed", async (event, filePath, newPath) => {
  fs.stat(filePath, (err, stat) => {
    if (err) {
      fs.open(newPath, "w", (err, file) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`File "${newPath}" created`);
        }
      });
    } else {
      fs.rename(filePath, newPath, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`File "${filePath}" is renamed to "${newPath}"`);
        }
      });
    }
  });
});
