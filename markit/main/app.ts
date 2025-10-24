import {
  app,
  dialog,
  globalShortcut,
  ipcMain,
  BrowserWindow,
  IpcMainEvent,
  Menu,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import * as shortcuts from "./shortcuts";
import * as menu from "./menu";
import * as recentFiles from "./recent-files";
import { MenuItem } from "../../types";
import { showErrorDialog, validatePath } from "./security";

let win: BrowserWindow | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 960,
    height: 720,
    title: "MarkIt",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "../index.html"));
  shortcuts.register(globalShortcut, win);
  menu.initAppMenu(win);
}

app.whenReady().then(createWindow);

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.on("new-file-dialog", async (event: IpcMainEvent) => {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: "untitled.md",
      filters: [{ name: "Markdown Files", extensions: ["md"] }],
    });
    if (result.filePath) {
      event.reply("new-file-created", result.filePath);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    await showErrorDialog("Failed to create new file", message);
  }
});

ipcMain.on("open-file-dialog", async (event: IpcMainEvent) => {
  if (!win) return;

  try {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Markdown Files", extensions: ["md"] }],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      event.reply("file-opened", result.filePaths);
      recentFiles.add(result.filePaths[0]);
      menu.initAppMenu(win);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    await showErrorDialog("Failed to open file", message);
  }
});

ipcMain.on("open-folder-dialog", async (event: IpcMainEvent) => {
  if (!win) return;

  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      event.reply("file-opened", result.filePaths);
      recentFiles.add(result.filePaths[0]);
      menu.initAppMenu(win);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    await showErrorDialog("Failed to open folder", message);
  }
});

ipcMain.on("save-file-dialog", async (event: IpcMainEvent) => {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: "untitled.md",
      filters: [{ name: "Markdown Files", extensions: ["md"] }],
    });
    if (result.filePath) {
      event.reply("save-file", result.filePath);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    await showErrorDialog("Failed to open save dialog", message);
  }
});

ipcMain.on(
  "save-file",
  async (_event: IpcMainEvent, filePath: string, content: string) => {
    try {
      const validatedPath = validatePath(filePath);
      await fs.promises.writeFile(validatedPath, content);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      await showErrorDialog("Failed to save file", message);
    }
  },
);

ipcMain.on("open-recent-file", async (event: IpcMainEvent) => {
  const recentOpenFiles = recentFiles.load();
  if (recentOpenFiles.length > 0) {
    event.reply("file-opened", recentOpenFiles[0]);
  }
});

ipcMain.on(
  "show-context-menu",
  async (event: IpcMainEvent, menuItems: MenuItem[]) => {
    if (!win) return;

    const template = menuItems.map((item: MenuItem) => ({
      label: item.label,
      click: () => {
        event.reply("context-menu-command", item.id);
      },
    }));

    const contextMenu = Menu.buildFromTemplate(template);
    contextMenu.popup({ window: win });
  },
);
