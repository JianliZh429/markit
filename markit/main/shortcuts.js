// Register global shortcuts

function register(shortcut, win, ipcMain) {
  shortcut.register("CommandOrControl+/", () => {
    win.webContents.send("toggle-mode");
  });

  shortcut.register("CommandOrControl+A", () => {
    win.webContents.send("select-all");
  });
}
module.exports = { register };
