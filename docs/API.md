# Markit API Documentation

**Version:** 0.0.7  
**Last Updated:** March 20, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Main Process API](#main-process-api)
3. [Renderer Process API](#renderer-process-api)
4. [IPC Channels](#ipc-channels)
5. [Services](#services)
6. [Modules](#modules)
7. [TypeScript Types](#typescript-types)

---

## Architecture Overview

Markit follows Electron's multi-process architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                          │
│  (Node.js - System APIs, File Operations, Lifecycle)    │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   app.ts    │  │   menu.ts   │  │  preload.ts │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ settings.ts │  │ security.ts │  │ shortcuts.ts│     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                         ↕ IPC
┌─────────────────────────────────────────────────────────┐
│                  Renderer Process                        │
│  (Chromium - UI, User Interaction, Rendering)           │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ renderer.ts │  │  state.ts   │  │  search.ts  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  editor.ts  │  │ preview.ts  │  │  fileTree.ts│     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## Main Process API

### app.ts

Application lifecycle and IPC handlers.

```typescript
// Main entry point
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// IPC Handlers
ipcMain.handle('load-file', (event, filePath) => Promise<string>);
ipcMain.handle('save-file', (event, filePath, content) => Promise<void>);
ipcMain.handle('list-directory', (event, dirPath) => Promise<string[]>);
ipcMain.handle('file-exists', (event, filePath) => Promise<boolean>);
ipcMain.handle('rename-file', (event, oldPath, newPath) => Promise<void>);
ipcMain.handle('delete-file', (event, filePath) => Promise<void>);
ipcMain.handle('create-file', (event, filePath) => Promise<void>);
ipcMain.handle('get-settings', () => Settings);
ipcMain.handle('save-settings', (event, settings) => void);
ipcMain.handle('update-settings', (event, partialSettings) => void);
```

### menu.ts

Application menu construction.

```typescript
export function initAppMenu(win: BrowserWindow): void;

// Menu Templates
- appMenu(): MenuItemConstructorOptions      // macOS app menu
- fileMenu(win): MenuItemConstructorOptions  // File operations
- editMenu(win): MenuItemConstructorOptions  // Edit operations
- viewMenu(win): MenuItemConstructorOptions  // View options
- winMenu(): MenuItemConstructorOptions      // Window controls
- helpMenu(): MenuItemConstructorOptions     // Help resources
```

### preload.ts

Security bridge between main and renderer processes.

```typescript
// Exposed API via contextBridge
window.electronAPI = {
  // File operations
  loadFile: (filePath: string) => Promise<string>;
  saveFile: (filePath: string, content: string) => Promise<void>;
  listDirectory: (dirPath: string) => Promise<string[]>;
  fileExists: (filePath: string) => Promise<boolean>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  createFile: (filePath: string) => Promise<void>;
  parsePath: (filePath: string) => ParsedPath;
  joinPath: (...paths: string[]) => string;
  isDirectory: (filePath: string) => boolean;
  isFile: (filePath: string) => boolean;
  
  // Settings
  settings: {
    get: () => Promise<Settings>;
    save: (settings: Settings) => Promise<void>;
    update: (partialSettings: Partial<Settings>) => Promise<void>;
  };
  
  // IPC communication
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, listener: (...args: any[]) => void) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  
  // Context menu
  showContextMenu: (menuItems: MenuItem[]) => void;
};
```

### settings.ts

User preferences management.

```typescript
export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  autosaveEnabled: boolean;
  autosaveInterval: number;
}

export function loadSettings(): Settings;
export function saveSettings(settings: Settings): void;
export function updateSettings(partial: Partial<Settings>): void;
export function getSettingsDir(): string;
```

### security.ts

Path validation and security utilities.

```typescript
export function validatePath(filePath: string): boolean;
export function validateMarkdownPath(filePath: string): boolean;
export function showErrorDialog(message: string): void;
```

### recent-opens.ts

Persistent recent files/folders tracking.

```typescript
export function load(): string[];
export function add(filePath: string): void;
export function remove(filePath: string): void;
export function clear(): void;
```

### shortcuts.ts

Global keyboard shortcuts.

```typescript
export function registerShortcuts(win: BrowserWindow): void;
export function unregisterShortcuts(): void;
```

---

## Renderer Process API

### renderer.ts

Main renderer orchestrator.

```typescript
// Core Functions
function loadFile(filePath: string): Promise<void>;
function loadFileContentOnly(filePath: string): Promise<void>;
function unloadFile(filePath: string): void;
function saveCurrentFile(): Promise<void>;

// Mode Management
function editorMode(): void;
function previewMode(): void;
function toggleMode(): void;

// Search
function showLocalSearch(): void;
function hideLocalSearch(): void;
function showGlobalSearch(): void;
function hideGlobalSearch(): void;

// Recent Files
function showRecentFilesModal(): void;
function hideRecentFilesModal(): void;
function navigateRecentFiles(direction: 'forward' | 'backward'): void;
```

### state.ts

Centralized state management.

```typescript
export class StateManager {
  private state: Map<string, any>;
  private listeners: Map<string, Set<Function>>;
  
  set<T>(key: string, value: T): void;
  get<T>(key: string): T | undefined;
  delete(key: string): void;
  clear(): void;
  
  on(key: string, listener: (value: any) => void): void;
  off(key: string, listener: Function): void;
  notify(key: string): void;
  
  persist(): void;
  restore(): void;
}
```

### search.ts

Search functionality.

```typescript
export async function searchInFiles(
  rootDir: string,
  keyword: string,
  fileService: FileService
): Promise<SearchResult[]>;

export interface SearchResult {
  filePath: string;
  matches: SearchMatch[];
}

export interface SearchMatch {
  line: number;
  text: string;
  context: string;
}
```

---

## Services

### FileService

File system operations wrapper.

```typescript
export class FileService {
  constructor(api: ElectronAPI);
  
  loadFile(filePath: string): Promise<string>;
  saveFile(filePath: string, content: string): Promise<void>;
  listDirectory(dirPath: string): Promise<string[]>;
  fileExists(filePath: string): Promise<boolean>;
  renameFile(oldPath: string, newPath: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  createFile(filePath: string): Promise<void>;
  parsePath(filePath: string): ParsedPath;
  joinPath(...paths: string[]): string;
  isDirectory(filePath: string): boolean;
  isFile(filePath: string): boolean;
}
```

### MarkdownService

Markdown parsing and rendering.

```typescript
export class MarkdownService {
  constructor(options: MarkdownServiceOptions);
  
  // Synchronous rendering
  render(content: string): string;
  
  // Async HTML to Markdown conversion
  htmlToMarkdown(html: string): Promise<string>;
  htmlToMarkdownAsync(html: string): Promise<string>;
  
  // Utility
  setBaseUrl(filePath: string): void;
  getWorker(): Worker | null;
}

export interface MarkdownServiceOptions {
  enableEmoji?: boolean;
  enableCodePreview?: boolean;
  baseUrl?: string;
}
```

---

## Modules

### EditorModule

Markdown editor functionality.

```typescript
export class EditorModule {
  constructor(editorElement: HTMLTextAreaElement);
  
  setContent(content: string): void;
  getContent(): string;
  getCursor(): { line: number; column: number };
  setCursor(line: number, column: number): void;
  getSelection(): { start: number; end: number; text: string };
  insertText(text: string): void;
  undo(): void;
  redo(): void;
  selectAll(): void;
}
```

### PreviewModule

Preview pane with live rendering.

```typescript
export class PreviewModule {
  constructor(previewElement: HTMLDivElement, markdownService: MarkdownService);
  
  render(content: string): void;
  getScrollPosition(): number;
  setScrollPosition(position: number): void;
  syncScroll(editorScroll: number): void;
}
```

### FileTreeModule

File explorer tree view.

```typescript
export class FileTreeModule {
  constructor(treeElement: HTMLUListElement, options: FileTreeOptions);
  
  getRootDirectory(): string;
  selectFileInTree(filePath: string): boolean;
  loadFileOrFolder(filePath: string): void;
  clear(): void;
  
  private changeSelected($target: HTMLLIElement): void;
  private switchFolderState($li: HTMLLIElement): void;
  private unfoldDir($li: HTMLLIElement, filePath: string): void;
}

export interface FileTreeOptions {
  fileService: FileService;
  onFileSelect: (filePath: string) => void;
  onFileCreate: (filePath: string) => void;
  onFileUnload: (filePath: string) => void;
  getCurrentTitle: () => string;
  setTitle: (title: string) => void;
  onFileIconClick?: (filePath: string) => void;
}
```

---

## IPC Channels

### Whitelisted Channels

```typescript
// Main → Renderer
const validSendChannels = [
  'file-opened',
  'new-file-dialog',
  'open-file-dialog',
  'open-folder-dialog',
  'save-opened-file',
  'save-file-dialog',
  'select-all',
  'toggle-explorer',
  'toggle-mode',
  'local-search',
  'global-search',
  'context-menu-command',
  'switch-recent-file',
  'open-recent',
  'open-settings',
];

// Renderer → Main (Invoke)
const validInvokeChannels = [
  'load-file',
  'save-file',
  'list-directory',
  'file-exists',
  'rename-file',
  'delete-file',
  'create-file',
  'get-settings',
  'save-settings',
  'update-settings',
];
```

### Channel Usage

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `file-opened` | Main → Renderer | Notify file opened |
| `load-file` | Renderer → Main | Load file content |
| `save-file` | Renderer → Main | Save file content |
| `toggle-mode` | Main → Renderer | Switch edit/preview |
| `open-settings` | Main → Renderer | Open settings modal |
| `get-settings` | Renderer → Main | Retrieve user settings |
| `save-settings` | Renderer → Main | Persist user settings |

---

## TypeScript Types

### Core Types

```typescript
// types/index.ts

export interface MenuItem {
  id: string;
  label: string;
}

export interface SearchResult {
  filePath: string;
  matches: SearchMatch[];
}

export interface SearchMatch {
  line: number;
  text: string;
  context: string;
}

export interface ParsedPath {
  dir: string;
  base: string;
  ext: string;
  name: string;
}

export interface RecentFile {
  path: string;
  timestamp: number;
}

export interface AppState {
  currentFile: string | null;
  currentFolder: string | null;
  recentFiles: RecentFile[];
  settings: Settings;
}
```

### Settings Types

```typescript
export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  autosaveEnabled: boolean;
  autosaveInterval: number;
}
```

---

## Extension Points

### Adding New IPC Handlers

1. Add handler in `app.ts`:
```typescript
ipcMain.handle('new-handler', async (event, data) => {
  // Implementation
});
```

2. Add to preload whitelist in `preload.ts`:
```typescript
const validInvokeChannels = [..., 'new-handler'];
```

3. Expose via contextBridge:
```typescript
newApi: (data: any) => ipcRenderer.invoke('new-handler', data);
```

### Adding New Settings

1. Update `Settings` interface in `settings.ts`
2. Add default value in `DEFAULT_SETTINGS`
3. Add IPC handlers if needed
4. Update settings UI in `index.html` and `renderer.ts`

---

## Testing

### Unit Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── security.test.ts
│   ├── markdown.test.ts
│   └── settings.test.ts
├── integration/           # Integration tests
│   └── ipc.test.ts
└── renderer/             # Renderer tests
    ├── editor.test.ts
    └── preview.test.ts
```

---

## Support

- **GitHub Issues**: https://github.com/JianliZh429/markit/issues
- **Discussions**: https://github.com/JianliZh429/markit/discussions
