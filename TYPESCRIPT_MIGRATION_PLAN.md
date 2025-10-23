# TypeScript Migration Development Plan for Markit

## Overview
Converting your Electron markdown editor from JavaScript to TypeScript will provide better type safety, improved IDE support, and easier maintenance. This document outlines a comprehensive step-by-step plan for the migration.

## Phase 1: Project Setup & Configuration

### 1.1 Install TypeScript Dependencies
```bash
npm install --save-dev typescript @types/node @types/marked
npm install --save-dev @types/electron
```

### 1.2 Create TypeScript Configuration Files

#### tsconfig.json (Root - for Main Process)
Create this file in the project root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist/main",
    "rootDir": "./markit/main",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["markit/main/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

#### tsconfig.renderer.json (for Renderer Process)
Create this file in the project root:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist/renderer",
    "rootDir": "./markit/renderer"
  },
  "include": ["markit/renderer/**/*"]
}
```

### 1.3 Update package.json Scripts

Replace the current scripts section with:

```json
{
  "scripts": {
    "build": "npm run build:main && npm run build:renderer && npm run copy:assets",
    "build:main": "tsc",
    "build:renderer": "tsc -p tsconfig.renderer.json",
    "copy:assets": "mkdir -p dist && cp markit/index.html dist/ && cp -R markit/assets dist/",
    "watch:main": "tsc --watch",
    "watch:renderer": "tsc -p tsconfig.renderer.json --watch",
    "start": "npm run build && electron dist/main/app.js",
    "format": "prettier --write markit/",
    "lint": "eslint markit/**/*.ts",
    "lint:fix": "eslint markit/**/*.ts --fix",
    "clean": "rm -rf build dist",
    "package": "npx electron-packager .  Markit --platform=linux,darwin --arch=x64 --icon markit/assets/images/markit.icns --out build/",
    "dmg": "electron-installer-dmg build/markit-darwin-x64/Markit.app --icon markit/assets/images/markit.icns --out build/installer Markit",
    "deb": "electron-installer-debian --src build/markit-linux-x64/ --platform linux --arch amd64 --icon markit/assets/images/markit.icns --dest build/installer",
    "installer": "npm run clean && npm run build && npm run package && npm run dmg && npm run deb"
  }
}
```

## Phase 2: Create Type Definitions

### 2.1 Create types/index.d.ts for Shared Types

Create a `types` directory and add `index.d.ts`:

```typescript
// IPC Message Types
export interface IpcChannels {
  'new-file-dialog': void;
  'open-file-dialog': void;
  'open-folder-dialog': void;
  'save-file-dialog': void;
  'save-file': { filePath: string; content: string };
  'save-opened-file': void;
  'file-opened': string | string[];
  'new-file-created': string;
  'toggle-mode': void;
  'select-all': void;
  'toggle-explorer': void;
  'local-search': void;
  'global-search': void;
  'open-recent-file': void;
  'show-context-menu': MenuItem[];
  'context-menu-command': string;
}

// Menu Item Types
export interface MenuItem {
  label: string;
  id: string;
  accelerator?: string;
  click?: () => void;
}

// File System Types
export interface FileTreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  children?: FileTreeNode[];
}

// Search Result Types
export interface SearchMatch {
  line: number;
  snippet: string;
  context: string;
}

export interface SearchResult {
  file: string;
  matches: SearchMatch[];
}

// Editor State
export interface EditorState {
  isEditMode: boolean;
  editorScrollTop: number;
  editorSelectionStart: number;
  editorSelectionEnd: number;
  previewScrollTop: number;
  previewCursorOffset: number;
}

// Recent Files
export interface RecentFileEntry {
  path: string;
  timestamp: number;
}
```

### 2.2 Create types/preload.d.ts for ElectronAPI

```typescript
import { SearchResult } from './index';

export interface ElectronAPI {
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  fs: {
    readFile: (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => void;
    writeFile: (path: string, data: string, callback: (err: Error | null) => void) => void;
    readdirSync: (path: string) => string[];
    statSync: (path: string) => { isDirectory: () => boolean; isFile: () => boolean };
    stat: (path: string, callback: (err: Error | null, stats: any) => void) => void;
    open: (path: string, flags: string, callback: (err: Error | null) => void) => void;
  };
  path: {
    join: (...paths: string[]) => string;
    parse: (path: string) => { base: string; ext: string; dir: string; name: string; root: string };
  };
  searchInFiles: (directory: string, keyword: string) => Promise<SearchResult[]>;
  parseMarkdown: (content: string) => string;
  setMarkdownBaseUrl: (filePath: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
```

## Phase 3: File Conversion Order

### 3.1 Main Process Files (Convert in this order)

#### 1. recent-files.js → recent-files.ts
- Simple utility, good starting point
- Define RecentFile interface
- Type file operations properly

**Key Changes:**
```typescript
import { RecentFileEntry } from '../types';

interface RecentFilesConfig {
  maxFiles: number;
  configPath: string;
}

export function add(filePath: string): void { /* ... */ }
export function load(): string[] { /* ... */ }
export function remove(filePath: string): void { /* ... */ }
```

#### 2. shortcuts.js → shortcuts.ts
- Define ShortcutConfig type
- Type the globalShortcut and ipcMain parameters

**Key Changes:**
```typescript
import { GlobalShortcut, IpcMain, BrowserWindow } from 'electron';

interface ShortcutBinding {
  accelerator: string;
  action: string;
}

export function register(
  globalShortcut: GlobalShortcut,
  win: BrowserWindow,
  ipcMain: IpcMain
): void { /* ... */ }
```

#### 3. menu.js → menu.ts
- Define MenuConfig interfaces
- Type the Menu template properly

**Key Changes:**
```typescript
import { BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';

export function initAppMenu(win: BrowserWindow): void {
  const template: MenuItemConstructorOptions[] = [
    // menu items
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

#### 4. preload.js → preload.ts
- Critical: properly type the contextBridge API
- Reference the ElectronAPI interface

**Key Changes:**
```typescript
import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from '../types/preload';

const electronAPI: ElectronAPI = {
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  // ... rest of API
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
```

#### 5. app.js → app.ts
- Main entry point
- Type all IPC handlers
- Type dialog results

**Key Changes:**
```typescript
import { app, dialog, globalShortcut, ipcMain, BrowserWindow, IpcMainEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let win: BrowserWindow | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 960,
    height: 720,
    title: 'MarkIt',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // ... rest
}

ipcMain.on('save-file', async (event: IpcMainEvent, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content);
    console.log(`File saved to ${filePath}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`File failed to save: ${error.message}`);
    }
  }
});
```

### 3.2 Renderer Process Files

#### 1. search.js → search.ts
- Type search functions and results

**Key Changes:**
```typescript
import { SearchResult, SearchMatch } from '../types';

export async function searchInFiles(
  directory: string,
  keyword: string
): Promise<SearchResult[]> {
  // implementation
}
```

#### 2. menu.js → menu.ts
- Type context menu items

**Key Changes:**
```typescript
import { MenuItem } from '../types';

export function buildContextMenu(items: MenuItem[]): MenuItem[] {
  // implementation
}
```

#### 3. renderer.js → renderer.ts
- Largest file, convert last
- Use all the type definitions created earlier
- Type all DOM elements with proper HTMLElement types
- Type all event handlers

**Key Changes:**
```typescript
import { ElectronAPI } from '../types/preload';
import { EditorState, SearchResult } from '../types';

const {
  send: ipcSend,
  on: ipcOn,
  fs,
  path,
  searchInFiles,
  parseMarkdown,
  setMarkdownBaseUrl,
} = window.electronAPI;

let isEditMode: boolean = false;
let $selected: HTMLLIElement | null = null;
let editorScrollTop: number = 0;
let editorSelectionStart: number = 0;
let editorSelectionEnd: number = 0;
let previewScrollTop: number = 0;
let previewCursorOffset: number = 0;

const $explorer = document.getElementById('explorer') as HTMLDivElement;
const $editor = document.getElementById('editor') as HTMLTextAreaElement;
const $previewer = document.getElementById('previewer') as HTMLDivElement;
const $tree = document.getElementById('tree') as HTMLUListElement;
const $title = document.querySelector('title') as HTMLTitleElement;

const fileDblClickListener = (event: MouseEvent): void => {
  const $li = event.target as HTMLLIElement;
  const filePath = $li.dataset.fullPath;
  if (!filePath) return;
  
  hideLocalSearch();
  hideGlobalSearch();
  changeSelected($li);
  loadFile(filePath);
  event.stopPropagation();
};

const folderDblClickListener = (event: MouseEvent): void => {
  const $li = event.target as HTMLLIElement;
  const filePath = $li.dataset.fullPath;
  if (!filePath) return;
  
  switchFolderState($li);
  const $ul = $li.getElementsByTagName('ul');
  if ($ul.length > 0) {
    $li.removeChild($ul[0]);
  } else {
    unfoldDir($li, filePath);
  }
  event.stopPropagation();
};
```

## Phase 4: Key TypeScript Patterns to Implement

### 4.1 IPC Type Safety

```typescript
// In main process
ipcMain.on('save-file', async (event: IpcMainEvent, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content);
    console.log(`File saved to ${filePath}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`File failed to save: ${error.message}`);
    }
  }
});
```

### 4.2 DOM Element Typing

```typescript
const $editor = document.getElementById('editor') as HTMLTextAreaElement;
const $previewer = document.getElementById('previewer') as HTMLDivElement;
const $tree = document.getElementById('tree') as HTMLUListElement;

// Always check for null when getting elements dynamically
const element = document.getElementById('someId');
if (!element) {
  console.error('Element not found');
  return;
}
```

### 4.3 Event Handler Typing

```typescript
const fileDblClickListener = (event: MouseEvent): void => {
  const $li = event.target as HTMLLIElement;
  const filePath = $li.dataset.fullPath;
  if (!filePath) return;
  // ... rest of implementation
};

$editor.addEventListener('paste', (event: ClipboardEvent): void => {
  event.preventDefault();
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;
  // ... rest of implementation
});
```

### 4.4 Async Function Typing

```typescript
async function loadFile(filePath: string): Promise<void> {
  setMarkdownBaseUrl(filePath);
  fs.readFile(filePath, 'utf8', (err: Error | null, data: string) => {
    if (err) {
      console.error(err);
      return;
    }
    $editor.value = data;
    if (!isEditMode) {
      previewMode();
    }
    $title.textContent = filePath;
  });
}

async function globalSearch(keyword: string): Promise<void> {
  hideLocalSearch();
  const results: SearchResult[] = await searchInFiles(rootDirectory(), keyword);
  // ... display results
}
```

### 4.5 Optional Chaining and Nullish Coalescing

```typescript
// Optional chaining
const recentFile = recentFiles[0]?.path;
const parentTag = child.parentElement?.tagName.toLowerCase();

// Nullish coalescing
const filePath = $li.dataset.fullPath ?? 'untitled.md';
const href = child.getAttribute('href') ?? '';
```

## Phase 5: Migration Checklist

### Setup Phase
- [ ] Install TypeScript and type definitions
- [ ] Create `tsconfig.json` (main process)
- [ ] Create `tsconfig.renderer.json` (renderer process)
- [ ] Update `package.json` scripts
- [ ] Create `types/index.d.ts` with shared types
- [ ] Create `types/preload.d.ts` for ElectronAPI
- [ ] Update `.gitignore` to exclude `dist/` directory

### Main Process Conversion
- [ ] Convert `markit/main/recent-files.js` to `.ts`
- [ ] Convert `markit/main/shortcuts.js` to `.ts`
- [ ] Convert `markit/main/menu.js` to `.ts`
- [ ] Convert `markit/main/preload.js` to `.ts`
- [ ] Convert `markit/main/app.js` to `.ts`
- [ ] Fix all TypeScript compilation errors in main process

### Renderer Process Conversion
- [ ] Convert `markit/renderer/search.js` to `.ts` (if exists)
- [ ] Convert `markit/renderer/menu.js` to `.ts`
- [ ] Convert `markit/renderer/renderer.js` to `.ts`
- [ ] Fix all TypeScript compilation errors in renderer process

### Testing & Refinement
- [ ] Test file opening and saving
- [ ] Test folder navigation and file tree
- [ ] Test edit mode and preview mode switching
- [ ] Test markdown rendering
- [ ] Test local search functionality
- [ ] Test global search functionality
- [ ] Test keyboard shortcuts
- [ ] Test menu items
- [ ] Test context menus
- [ ] Test recent files functionality
- [ ] Update build and packaging scripts if needed
- [ ] Run full build and verify output
- [ ] Test packaged application

### Documentation
- [ ] Update README.md with TypeScript setup instructions
- [ ] Document any breaking changes
- [ ] Update contributing guidelines if applicable

## Phase 6: Best Practices

### 6.1 Strict Mode Benefits
- Enable `strict: true` in tsconfig to catch more errors
- Use `strictNullChecks` to handle undefined/null properly
- Use `noImplicitAny` to ensure all types are explicit

### 6.2 Error Handling

```typescript
// Always type catch blocks properly
try {
  await someAsyncOperation();
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error occurred');
  }
}
```

### 6.3 Type Guards

```typescript
function isHTMLElement(element: any): element is HTMLElement {
  return element instanceof HTMLElement;
}

function isSearchResult(obj: any): obj is SearchResult {
  return obj && typeof obj.file === 'string' && Array.isArray(obj.matches);
}
```

### 6.4 Utility Types

```typescript
// Make all properties optional
type PartialEditorState = Partial<EditorState>;

// Pick specific properties
type EditorPosition = Pick<EditorState, 'editorScrollTop' | 'editorSelectionStart'>;

// Make all properties readonly
type ReadonlyEditorState = Readonly<EditorState>;
```

## Phase 7: ESLint Configuration for TypeScript

Update `eslint.config.js` to support TypeScript:

```javascript
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },
];
```

Install required packages:
```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## Estimated Timeline

- **Phase 1 (Setup)**: 1-2 hours
- **Phase 2 (Type Definitions)**: 2-3 hours
- **Phase 3.1 (Main Process Files)**: 4-6 hours
- **Phase 3.2 (Renderer Process Files)**: 6-8 hours
- **Phase 4 (Pattern Implementation)**: Concurrent with Phase 3
- **Phase 5 (Testing)**: 2-4 hours
- **Phase 6-7 (Best Practices & ESLint)**: 1-2 hours

**Total Estimated Time**: 16-25 hours

## Benefits After Migration

1. **Type Safety**: Catch bugs at compile time, not runtime
2. **Better IDE Support**: Enhanced autocomplete, IntelliSense, and code navigation
3. **Easier Refactoring**: Rename symbols with confidence across the entire codebase
4. **Self-Documenting Code**: Types serve as inline documentation
5. **Reduced Runtime Errors**: Fewer type-related bugs in production
6. **Better Collaboration**: Team members can understand code contracts more easily
7. **Future-Proof**: Easier to adopt new Electron/Node.js features

## Common Pitfalls to Avoid

1. **Don't use `any` excessively**: It defeats the purpose of TypeScript
2. **Don't ignore type errors**: Fix them properly rather than using type assertions
3. **Don't over-complicate types**: Start simple and refine as needed
4. **Don't forget to type IPC messages**: This is a common source of bugs in Electron apps
5. **Don't skip testing**: Type safety doesn't guarantee runtime correctness

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Electron TypeScript Docs](https://www.electronjs.org/docs/latest/tutorial/typescript)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [@types/electron](https://www.npmjs.com/package/@types/electron)
- [@types/node](https://www.npmjs.com/package/@types/node)

## Next Steps

Once you're ready to proceed with the migration:
1. Review this plan thoroughly
2. Set up a new branch for the migration: `git checkout -b typescript-migration`
3. Follow the phases in order
4. Commit frequently with descriptive messages
5. Test thoroughly before merging

Good luck with your TypeScript migration! 🚀
