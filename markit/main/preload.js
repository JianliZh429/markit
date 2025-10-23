const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { searchInFiles } = require("../renderer/search.js");
const { marked } = require("marked");
const markedCodePreview = require("marked-code-preview");
const { markedEmoji } = require("marked-emoji");
const { baseUrl } = require("marked-base-url");
const { Octokit } = require("@octokit/rest");

// Create Octokit instance here instead of passing the class
const octokit = new Octokit();

// Initialize marked with plugins once emojis are fetched
let markedInitialized = false;
async function initializeMarked() {
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
contextBridge.exposeInMainWorld("electronAPI", {
  // IPC communication
  send: (channel, ...args) => {
    // Whitelist channels
    const validChannels = [
      "open-file-dialog",
      "open-folder-dialog",
      "save-file-dialog",
      "save-file",
      "new-file-dialog",
      "open-recent-file",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  
  on: (channel, func) => {
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
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },

  showContextMenu: (menuItems) => {
    ipcRenderer.send("show-context-menu", menuItems);
  },

  // Search functionality
  searchInFiles: async (directory, keyword, fileExtension) => {
    return await searchInFiles(directory, keyword, fileExtension);
  },

  // File system operations
  fs: {
    readFile: (filePath, encoding, callback) => {
      fs.readFile(filePath, encoding, callback);
    },
    readdirSync: (dirPath) => {
      return fs.readdirSync(dirPath);
    },
    statSync: (filePath) => {
      const stats = fs.statSync(filePath);
      return {
        isFile: () => stats.isFile(),
        isDirectory: () => stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime,
      };
    },
    stat: (filePath, callback) => {
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
    writeFile: (filePath, content, callback) => {
      fs.writeFile(filePath, content, callback);
    },
    open: (filePath, flags, callback) => {
      fs.open(filePath, flags, callback);
    },
    rename: (oldPath, newPath, callback) => {
      fs.rename(oldPath, newPath, callback);
    },
    rmdir: (dirPath, options, callback) => {
      fs.rmdir(dirPath, options, callback);
    },
    unlink: (filePath, callback) => {
      fs.unlink(filePath, callback);
    },
  },

  // Path utilities
  path: {
    parse: (filePath) => {
      return path.parse(filePath);
    },
    join: (...paths) => {
      return path.join(...paths);
    },
  },

  // Markdown parsing functions
  parseMarkdown: (content) => {
    return marked.parse(content);
  },
  
  setMarkdownBaseUrl: (url) => {
    marked.use(baseUrl(url));
  },
});
