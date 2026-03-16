# Markit Architecture

This document describes the architecture of Markit, an Electron-based markdown editor.

## Overview

Markit follows Electron's multi-process architecture with a main process and renderer process communicating via IPC (Inter-Process Communication).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Main Process                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   app.ts     │  │   menu.ts    │  │  security.ts │      │
│  │  (Entry)     │  │  (Menu Bar)  │  │  (Validator) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│  ┌──────▼──────────────────▼──────────────────▼───────┐     │
│  │            IPC Communication Layer                  │     │
│  └──────────────────────┬──────────────────────────────┘     │
└─────────────────────────┼──────────────────────────────────┘
                          │
          ┌───────────────▼───────────────┐
          │      preload.ts (Bridge)      │
          │   - Exposes safe APIs         │
          │   - Validates IPC channels    │
          └───────────────┬───────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    Renderer Process                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ renderer.js  │  │   state.ts   │  │  search.ts   │     │
│  │   (UI)       │  │  (State Mgmt)│  │  (Search)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │              Service Layer                          │    │
│  │   fileService.ts  │  markdownService.ts            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Process Architecture

### Main Process (Node.js Environment)

The main process runs Node.js and has full access to system APIs. It is responsible for:

- **Application Lifecycle** (`app.ts`)
  - Window management
  - Application startup/shutdown
  - Event coordination

- **Menu System** (`menu.ts`)
  - Application menu
  - Context menus
  - Menu item handlers

- **Security** (`security.ts`)
  - Path validation
  - Directory traversal prevention
  - Safe directory restrictions

- **File Management** (`recent-files.ts`)
  - Recent files list
  - File persistence

- **Configuration** (`config.ts`)
  - User preferences
  - Application settings
  - Persistent configuration

- **Logging** (`utils/logger.ts`)
  - Centralized logging
  - Log level management
  - Log buffering

### Preload Script (Bridge)

The preload script (`preload.ts`) acts as a security bridge between main and renderer:

- Exposes safe APIs to renderer via `contextBridge`
- Whitelists allowed IPC channels
- Validates all cross-process communication
- Prevents direct Node.js access from renderer

**Security Model:**
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, ...args) => {
    // Validate channel is whitelisted
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  // ... other safe APIs
});
```

### Renderer Process (Browser Environment)

The renderer process runs in a Chromium browser context with no direct Node.js access:

- **UI Layer** (`renderer.js`, `menu.js`)
  - DOM manipulation
  - User interactions
  - Event handling

- **State Management** (`state.ts`)
  - Centralized application state
  - Event-driven updates
  - State change listeners

- **Service Layer**
  - `fileService.ts`: File operations abstraction
  - `markdownService.ts`: Markdown parsing and conversion

- **Search** (`search.ts`)
  - File content search
  - Result caching
  - Performance optimization

- **Performance Utilities** (`utils/performance.ts`)
  - Debouncing/throttling
  - LRU caching
  - Performance measurement

## Data Flow

### File Loading Flow

```
1. User clicks "Open File" in menu
   └─> menu.ts: menuTemplate.click()
       └─> IPC: send('open-file-dialog')
           └─> preload.ts: validates channel
               └─> app.ts: handles dialog
                   └─> IPC: send('file-opened', path)
                       └─> preload.ts: validates & forwards
                           └─> renderer.js: loads file
                               └─> fileService.loadFile(path)
                                   └─> Updates UI with content
```

### Search Flow

```
1. User enters search query
   └─> renderer.js: input event
       └─> searchInFiles(directory, keyword)
           ├─> Check LRU cache
           │   ├─> Cache hit: return cached results
           │   └─> Cache miss: continue
           ├─> Scan files with fast-glob
           ├─> Read file contents
           ├─> Pattern matching
           ├─> Store in cache
           └─> Return results to UI
```

### Markdown Rendering Flow

```
1. User edits markdown
   └─> renderer.js: input event
       └─> markdownService.parse(content)
           ├─> Check render cache
           │   ├─> Cache hit: return cached HTML
           │   └─> Cache miss: continue
           ├─> marked.parse(content)
           ├─> Apply plugins (emoji, code preview, etc.)
           ├─> Store in cache
           └─> Return HTML to preview pane
```

## Module Dependencies

### Main Process Dependencies

```
app.ts
├── menu.ts
├── security.ts
├── recent-files.ts
├── shortcuts.ts
├── config.ts
└── utils/logger.ts

menu.ts
├── security.ts
└── utils/logger.ts

config.ts
├── utils/logger.ts
└── fs-extra

security.ts
└── electron.app
```

### Renderer Process Dependencies

```
renderer.js
├── state.ts
├── services/fileService.ts
├── services/markdownService.ts
├── search.ts
└── electronAPI (from preload)

search.ts
├── utils/performance.ts (LRUCache)
└── fast-glob

services/markdownService.ts
├── utils/performance.ts (LRUCache)
└── marked

services/fileService.ts
├── state.ts
└── electronAPI
```

## Security Architecture

### Threat Model

**Threats:**
1. Directory traversal attacks
2. Arbitrary code execution
3. Unauthorized file access
4. XSS via markdown content

**Mitigations:**
1. Path validation in `security.ts`
2. Sandboxed renderer process
3. Whitelisted IPC channels
4. Content Security Policy
5. Sanitized markdown rendering

### Security Layers

1. **Process Isolation**
   - Renderer runs in sandbox
   - No direct Node.js access

2. **IPC Channel Whitelisting**
   - Only allowed channels work
   - All others rejected silently

3. **Path Validation**
   - All paths validated before use
   - Restricted to safe directories
   - Null byte sanitization

4. **Content Security**
   - CSP headers set
   - Markdown sanitization
   - Safe HTML rendering

## State Management

### State Architecture

```typescript
AppState {
  isEditMode: boolean
  currentFilePath: string | null
  selectedTreeNode: HTMLElement | null
  editorScrollTop: number
  editorSelectionStart: number
  editorSelectionEnd: number
  previewScrollTop: number
  previewCursorOffset: number
  isExplorerVisible: boolean
  isLocalSearchVisible: boolean
  isGlobalSearchVisible: boolean
}
```

### State Flow

```
User Action
  └─> UI Event Handler
      └─> stateManager.setState(updates)
          └─> Notifies all listeners
              └─> Listeners update UI
```

### State Listeners

Components subscribe to state changes:

```typescript
stateManager.subscribe((newState) => {
  // React to state changes
  updateUI(newState);
});
```

## Performance Optimizations

### Caching Strategy

1. **Search Results Cache** (LRU, 50 entries)
   - Caches file search results
   - Key: `directory:keyword:extension`
   - Eliminates redundant file scans

2. **Markdown Render Cache** (LRU, 100 entries)
   - Caches parsed HTML
   - Key: markdown content
   - Avoids expensive re-parsing

3. **Recent Files Cache** (In-memory, 10 entries)
   - Quick access to recent files
   - Persisted to disk

### Debouncing

- Search inputs debounced (300ms)
- Configuration saves debounced (1000ms)
- Preview updates debounced (300ms)

## Configuration System

### Configuration Storage

Location: `{userData}/config.json`

Structure:
```json
{
  "theme": "auto",
  "fontSize": 14,
  "autosaveEnabled": true,
  "autosaveInterval": 30000,
  "recentFilesLimit": 10,
  // ... more settings
}
```

### Configuration Flow

```
Load: config.json → ConfigManager → Application
Save: Application → ConfigManager → (debounced) → config.json
```

## Testing Architecture

### Test Structure

```
tests/
├── unit/              # Unit tests
│   ├── recent-files.test.ts
│   ├── security.test.ts
│   └── search.test.ts
├── integration/       # Integration tests
│   └── ipc.test.ts
└── e2e/              # End-to-end tests (future)
```

### Test Coverage Goals

- Utility modules: 70%+
- Service layer: 60%+
- Main process core: 50%+

## Build Process

### TypeScript Compilation

```
Source (.ts) → TypeScript Compiler → JavaScript (.js) → dist/
```

### Build Configurations

- **Development**: Source maps enabled, no minification
- **Production**: Minified, optimized, no source maps

### Build Output

```
dist/
├── main/              # Compiled main process
└── renderer/          # Compiled renderer process
```

## Future Architecture Improvements

1. **Web Workers**: Move expensive operations off main thread
2. **Virtual Scrolling**: For large file trees
3. **Code Splitting**: Reduce initial bundle size
4. **Hot Module Replacement**: Faster development iteration
5. **Service Worker**: Offline capabilities
6. **Database**: IndexedDB for large file handling

## Debugging

### Main Process

- Use VS Code debugger
- Attach to Electron main process
- Set breakpoints in TypeScript

### Renderer Process

- Use Chrome DevTools
- Open with `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
- Source maps enabled for TypeScript debugging

### IPC Communication

- Enable IPC logging in preload
- Monitor with `utils/logger.ts`
- Check allowed channels list

## Performance Monitoring

Use `measurePerformance()` utility:

```typescript
await measurePerformance('Operation Name', async () => {
  // Operation code
});
```

Logs execution time to console.

## References

- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Marked.js](https://marked.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
