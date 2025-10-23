import { contextBridge, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
// Note: search module will be converted to TS later
const { searchInFiles } = require('../renderer/search.js');
import { marked } from 'marked';
import markedCodePreview from 'marked-code-preview';
import { markedEmoji } from 'marked-emoji';
import { baseUrl } from 'marked-base-url';
import { Octokit } from '@octokit/rest';
import { MenuItem } from '../../types';

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
          unicode: false,
        }),
      );
    markedInitialized = true;
  }
}

// Initialize on load
initializeMarked();

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC communication
  send: (channel: string, ...args: any[]): void => {
    // Whitelist channels
    const validChannels = [
      'open-file-dialog',
      'open-folder-dialog',
      'save-file-dialog',
      'save-file',
      'new-file-dialog',
      'open-recent-file',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  on: (channel: string, func: (...args: any[]) => void): void => {
    const validChannels = [
      'toggle-mode',
      'select-all',
      'open-file-dialog',
      'open-folder-dialog',
      'file-opened',
      'save-opened-file',
      'save-file-dialog',
      'save-file',
      'new-file-dialog',
      'new-file-created',
      'toggle-explorer',
      'local-search',
      'global-search',
      'context-menu-command',
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },

  showContextMenu: (menuItems: MenuItem[]): void => {
    ipcRenderer.send('show-context-menu', menuItems);
  },

  // Search functionality
  searchInFiles: async (
    directory: string,
    keyword: string,
    fileExtension?: string
  ): Promise<any> => {
    return await searchInFiles(directory, keyword, fileExtension);
  },

  // File system operations
  fs: {
    readFile: (
      filePath: string,
      encoding: string,
      callback: (err: Error | null, data: string) => void
    ): void => {
      fs.readFile(filePath, encoding as BufferEncoding, callback);
    },
    readdirSync: (dirPath: string): string[] => {
      return fs.readdirSync(dirPath);
    },
    statSync: (filePath: string): {
      isFile: () => boolean;
      isDirectory: () => boolean;
      size: number;
      mtime: Date;
    } => {
      const stats = fs.statSync(filePath);
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
        }
      ) => void
    ): void => {
      fs.stat(filePath, (err, stats) => {
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
    },
    writeFile: (
      filePath: string,
      content: string,
      callback: (err: Error | null) => void
    ): void => {
      fs.writeFile(filePath, content, callback);
    },
    open: (
      filePath: string,
      flags: string,
      callback: (err: Error | null) => void
    ): void => {
      fs.open(filePath, flags, callback);
    },
    rename: (
      oldPath: string,
      newPath: string,
      callback: (err: Error | null) => void
    ): void => {
      fs.rename(oldPath, newPath, callback);
    },
    rmdir: (
      dirPath: string,
      options: any,
      callback: (err: Error | null) => void
    ): void => {
      fs.rmdir(dirPath, options, callback);
    },
    unlink: (filePath: string, callback: (err: Error | null) => void): void => {
      fs.unlink(filePath, callback);
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
