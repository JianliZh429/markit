const {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
} = require("electron");

const shortcuts = require("./shortcuts.js");
const appMenu = require("./app-menu");
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

  win.loadFile("../index.html");
  shortcuts.register(globalShortcut, win, ipcMain);
  appMenu.init(win);
}

app.whenReady().then(createWindow);

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.on("open-file-directory-dialog", (event) => {
  dialog
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
