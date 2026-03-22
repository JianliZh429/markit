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
import * as fsExtra from "fs-extra";
import fg from "fast-glob";
import * as shortcuts from "./shortcuts";
import * as menu from "./menu";
import * as recentOpens from "./recent-opens";
import * as settings from "./settings";
import { MenuItem, SearchResult, SearchMatch } from "../../types";
import { showErrorDialog, validatePath, validateMarkdownPath } from "./security";

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
      recentOpens.add(result.filePaths[0]);
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
      recentOpens.add(result.filePaths[0]);
      menu.initAppMenu(win);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    await showErrorDialog("Failed to open folder", message);
  }
});

ipcMain.on("save-file-dialog", async (event: IpcMainEvent) => {
  if (!win) return;

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
      const validatedPath = validateMarkdownPath(filePath, true); // Resolve symlinks for security
      await fs.promises.writeFile(validatedPath, content);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      await showErrorDialog("Failed to save file", message);
    }
  },
);

ipcMain.on("open-recent", async (event: IpcMainEvent) => {
  const recentOpenFiles = recentOpens.load();
  if (recentOpenFiles.length > 0) {
    event.reply("file-opened", recentOpenFiles[0]);
  }
});

// Get recent opens filtered by root directory
ipcMain.handle(
  "get-recent-opens",
  async (_event, rootDirectory: string | null): Promise<string[]> => {
    const allRecentOpens = recentOpens.load();
    if (!rootDirectory) {
      return allRecentOpens;
    }
    // Filter files that are under the root directory
    return allRecentOpens.filter((filePath: string) =>
      filePath.startsWith(rootDirectory),
    );
  },
);

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

// Handle search-in-files requests
ipcMain.handle(
  "search-in-files",
  async (
    _event,
    directory: string,
    keyword: string,
    fileExtension: string = "md",
  ): Promise<SearchResult[]> => {
    try {
      const validatedDir = validatePath(directory);

      // Define the pattern to match only files with specified extension
      const pattern = `${validatedDir}/**/*.${fileExtension}`;
      const files = await fg(pattern);

      const results: SearchResult[] = [];
      for (const file of files) {
        try {
          // Read the content of the file
          const content = await fsExtra.readFile(file, "utf-8");

          // Find all matches for the keyword
          const regex = new RegExp(keyword, "gi");
          const matches = [...content.matchAll(regex)];

          if (matches.length > 0) {
            results.push({
              file,
              matches: matches.map((match): SearchMatch => {
                const matchIndex = match.index ?? 0;
                // Convert character index to line number
                const lineNumber = content.slice(0, matchIndex).split("\n").length;
                const snippetStart = Math.max(0, matchIndex - 20);
                const snippetEnd = Math.min(
                  content.length,
                  matchIndex + keyword.length + 20,
                );
                const snippet = content.substring(snippetStart, snippetEnd);

                // Highlight the keyword in the snippet
                const highlightedSnippet = snippet.replace(
                  regex,
                  `<mark>${keyword}</mark>`,
                );

                return {
                  line: lineNumber,
                  snippet: highlightedSnippet,
                  context: snippet,
                };
              }),
            });
          }
        } catch (err: unknown) {
          // Silently skip files that cannot be read
        }
      }

      return results;
    } catch (error: unknown) {
      // Log errors in development mode only
      if (process.env.NODE_ENV !== "production") {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Search failed:", message);
      }
      throw error;
    }
  },
);

// Handle autosave requests
ipcMain.on(
  "autosave-file",
  async (_event: IpcMainEvent, filePath: string, content: string) => {
    try {
      const validatedPath = validateMarkdownPath(filePath, true); // Resolve symlinks for security
      await fs.promises.writeFile(validatedPath, content);
    } catch (error: unknown) {
      // Log errors in development mode only
      if (process.env.NODE_ENV !== "production") {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Autosave failed:", message);
      }
    }
  },
);

// Settings IPC handlers
ipcMain.handle("get-settings", (): settings.Settings => {
  return settings.loadSettings();
});

ipcMain.handle("save-settings", (_event: Electron.IpcMainInvokeEvent, settingsData: settings.Settings): void => {
  settings.saveSettings(settingsData);
});

ipcMain.handle("update-settings", (_event: Electron.IpcMainInvokeEvent, partialSettings: Partial<settings.Settings>): void => {
  settings.updateSettings(partialSettings);
});

// Export to HTML
ipcMain.handle("export-html", async (event: Electron.IpcMainInvokeEvent, html: string, defaultFileName: string): Promise<string | null> => {
  try {
    const result = await dialog.showSaveDialog({
      title: "Export to HTML",
      defaultPath: defaultFileName || "exported-document.html",
      filters: [
        { name: "HTML Files", extensions: ["html"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    
    if (result.canceled || !result.filePath) {
      return null;
    }
    
    await fsExtra.writeFile(result.filePath, html, "utf-8");
    return result.filePath;
  } catch (error) {
    console.error("Export HTML error:", error);
    return null;
  }
});

// Save dropped image
ipcMain.handle("save-image", async (event: Electron.IpcMainInvokeEvent, dataUrl: string, filePath: string): Promise<boolean> => {
  try {
    // Extract base64 data from data URL
    const matches = dataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      console.error('Invalid data URL format');
      return false;
    }
    
    // Ensure directory exists
    const path = require('path');
    const dir = path.dirname(filePath);
    await fsExtra.ensureDir(dir);
    
    // Write the image file
    const imageBuffer = Buffer.from(matches[2], 'base64');
    await fsExtra.writeFile(filePath, imageBuffer);
    console.log('Image saved to:', filePath);
    return true;
  } catch (error) {
    console.error("Save image error:", error);
    return false;
  }
});

// Register global shortcut for opening settings (Ctrl/Cmd + ,)
app.whenReady().then(() => {
  globalShortcut.register("CommandOrControl+,", () => {
    if (win) {
      win.webContents.send("open-settings");
    }
  });
  
  // Register global shortcut for export (Ctrl/Cmd + E)
  globalShortcut.register("CommandOrControl+E", () => {
    if (win) {
      win.webContents.send("export-document");
    }
  });
});
