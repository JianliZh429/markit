const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const shortcuts = require("./shortcuts.js");
require("./app-menu");
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
}

app.whenReady().then(createWindow);

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.on("open-file-dialog", async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Markdown Files", extensions: ["md"] }],
  });

  if (!canceled && filePaths.length > 0) {
    const filePath = filePaths[0];
    const content = fs.readFileSync(filePath, "utf8");
    event.reply("file-opened", content);
  }
});

ipcMain.on("open-directory-dialog", async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (!canceled && filePaths.length > 0) {
    const directoryPath = filePaths[0];
    const files = fs.readdirSync(directoryPath, { withFileTypes: true });

    const markdownFiles = files
      .filter((file) => file.isFile() && file.name.endsWith(".md"))
      .map((file) => path.join(directoryPath, file.name));

    const directories = files
      .filter((file) => file.isDirectory())
      .map((file) => path.join(directoryPath, file.name));

    event.reply("directory-opened", { markdownFiles, directories });
  }
});
