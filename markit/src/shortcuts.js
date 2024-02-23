// Register global shortcuts

function register(shortcut, win, ipcMain) {
  shortcut.register("CommandOrControl+S", () => {
    if (win) {
      win.webContents.send("save-file");
    }
  });
  shortcut.register("CommandOrControl+/", () => {
    win.webContents.send("toggle-mode");
  });
}
module.exports = { register };
