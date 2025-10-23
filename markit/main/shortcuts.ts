import { GlobalShortcut, BrowserWindow, IpcMain } from 'electron';

// Register global shortcuts
export function register(
  _shortcut: GlobalShortcut,
  _win: BrowserWindow,
  _ipcMain: IpcMain
): void {
  // shortcut.register("CommandOrControl+/", () => {
  //   win.webContents.send("toggle-mode");
  // });
}
