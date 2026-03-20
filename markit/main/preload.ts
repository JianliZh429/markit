import { contextBridge, ipcRenderer } from "electron";
import * as fs from "fs";
import * as path from "path";
import { marked } from "marked";
import markedCodePreview from "marked-code-preview";
import { markedEmoji } from "marked-emoji";
import { baseUrl } from "marked-base-url";
import { Octokit } from "@octokit/rest";
import { MenuItem } from "../../types";
import { validatePath, showErrorDialog } from "./security";

// Create Octokit instance here instead of passing the class
const octokit = new Octokit();

// Initialize marked with plugins once emojis are fetched
let markedInitialized = false;
async function initializeMarked(): Promise<void> {
  if (!markedInitialized) {
    const response = await octokit.rest.emojis.get();
    marked
      .use({ gfm: true })
      .use(markedCodePreview())
      .use(
        markedEmoji({
          emojis: response.data,
        }),
      );
    markedInitialized = true;
  }
}

// Initialize on load
initializeMarked();

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // IPC communication
  send: (channel: string, ...args: unknown[]): void => {
    // Whitelist channels
    const validChannels = [
      "open-file-dialog",
      "open-folder-dialog",
      "save-file-dialog",
      "save-file",
      "new-file-dialog",
      "open-recent",
      "switch-recent-file",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  on: (channel: string, func: (...args: unknown[]) => void): void => {
    const validChannels = [
      "toggle-mode",
      "select-all",
      "open-file-dialog",
      "open-folder-dialog",
      "file-opened",
      "save-opened-file",
      "save-file-dialog",
      "save-file",
      "new-file-dialog",
      "new-file-created",
      "toggle-explorer",
      "local-search",
      "global-search",
      "context-menu-command",
      "switch-recent-file",
      "open-recent",
      "open-settings",
      "show-keyboard-shortcuts",
      "toggle-toc",
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },

  // Settings API
  settings: {
    get: async () => {
      return await ipcRenderer.invoke("get-settings");
    },
    save: async (settingsData: unknown) => {
      return await ipcRenderer.invoke("save-settings", settingsData);
    },
    update: async (partialSettings: unknown) => {
      return await ipcRenderer.invoke("update-settings", partialSettings);
    },
  },

  showContextMenu: (menuItems: MenuItem[]): void => {
    ipcRenderer.send("show-context-menu", menuItems);
  },

  // Search functionality - now via IPC
  searchInFiles: async (
    directory: string,
    keyword: string,
    fileExtension?: string,
  ): Promise<unknown> => {
    return await ipcRenderer.invoke(
      "search-in-files",
      directory,
      keyword,
      fileExtension,
    );
  },

  // Get recent opens filtered by root directory
  getRecentOpens: async (rootDirectory: string | null): Promise<string[]> => {
    return await ipcRenderer.invoke("get-recent-opens", rootDirectory);
  },

  // File system operations
  fs: {
    readFile: (
      filePath: string,
      encoding: string,
      callback: (err: Error | null, data: string) => void,
    ): void => {
      try {
        const validatedPath = validatePath(filePath);
        fs.readFile(validatedPath, encoding as BufferEncoding, callback);
      } catch (error) {
        callback(error as Error, "");
      }
    },
    readdirSync: (dirPath: string): string[] => {
      const validatedPath = validatePath(dirPath);
      return fs.readdirSync(validatedPath);
    },
    statSync: (
      filePath: string,
    ): {
      isFile: () => boolean;
      isDirectory: () => boolean;
      size: number;
      mtime: Date;
    } => {
      const validatedPath = validatePath(filePath);
      const stats = fs.statSync(validatedPath);
      return {
        isFile: () => stats.isFile(),
        isDirectory: () => stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime,
      };
    },
    stat: (
      filePath: string,
      callback: (
        err: Error | null,
        stats?: {
          isFile: () => boolean;
          isDirectory: () => boolean;
          size: number;
          mtime: Date;
        },
      ) => void,
    ): void => {
      try {
        const validatedPath = validatePath(filePath);
        fs.stat(validatedPath, (err, stats) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              isFile: () => stats.isFile(),
              isDirectory: () => stats.isDirectory(),
              size: stats.size,
              mtime: stats.mtime,
            });
          }
        });
      } catch (error) {
        callback(error as Error);
      }
    },
    writeFile: (
      filePath: string,
      content: string,
      callback: (err: Error | null) => void,
    ): void => {
      try {
        const validatedPath = validatePath(filePath);
        fs.writeFile(validatedPath, content, callback);
      } catch (error) {
        callback(error as Error);
      }
    },
    open: (
      filePath: string,
      flags: string,
      callback: (err: Error | null) => void,
    ): void => {
      try {
        const validatedPath = validatePath(filePath);
        fs.open(validatedPath, flags, callback);
      } catch (error) {
        callback(error as Error);
      }
    },
    rename: (
      oldPath: string,
      newPath: string,
      callback: (err: Error | null) => void,
    ): void => {
      try {
        const validatedOldPath = validatePath(oldPath);
        const validatedNewPath = validatePath(newPath);
        fs.rename(validatedOldPath, validatedNewPath, callback);
      } catch (error) {
        callback(error as Error);
      }
    },
    rmdir: (
      dirPath: string,
      options: fs.RmDirOptions,
      callback: (err: Error | null) => void,
    ): void => {
      try {
        const validatedPath = validatePath(dirPath);
        fs.rmdir(validatedPath, options, callback);
      } catch (error) {
        callback(error as Error);
      }
    },
    unlink: (filePath: string, callback: (err: Error | null) => void): void => {
      try {
        const validatedPath = validatePath(filePath);
        fs.unlink(validatedPath, callback);
      } catch (error) {
        callback(error as Error);
      }
    },
  },

  // Path utilities
  path: {
    parse: (filePath: string): path.ParsedPath => {
      return path.parse(filePath);
    },
    join: (...paths: string[]): string => {
      return path.join(...paths);
    },
  },

  // Markdown parsing functions
  parseMarkdown: (content: string): string => {
    return marked.parse(content) as string;
  },

  setMarkdownBaseUrl: (url: string): void => {
    marked.use(baseUrl(url));
  },
});
