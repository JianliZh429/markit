// Register global shortcuts

function register(shortcut, win, ipcMain) {
  shortcut.register("CommandOrControl+/", () => {
    win.webContents.send("toggle-mode");
  });

  shortcut.register("CommandOrControl+A", () => {
    win.webContents.send("select-all");
  });
  shortcut.register("CommandOrControl+E", () => {
    win.webContents.send("toggle-explorer");
  });
  shortcut.register("CommandOrControl+F", () => {
    win.webContents.send("search-in-file");
  });
}
module.exports = { register };
