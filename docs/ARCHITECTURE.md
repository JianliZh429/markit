# Markit Architecture

**Last Updated:** March 17, 2026  
**Version:** v0.0.4

This document describes the architecture of Markit, a modern Electron-based markdown editor with enhanced security, performance optimizations, and a modular architecture.

## Overview

Markit follows Electron's multi-process architecture with a main process and renderer process communicating via IPC (Inter-Process Communication). The application features a modular design with Web Workers for heavy operations, comprehensive security measures, and performance optimizations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Main Process                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   app.ts     │  │   menu.ts    │  │  security.ts │          │
│  │  (Entry)     │  │  (Menu Bar)  │  │  (Validator) │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │            IPC Communication Layer                  │         │
│  └──────────────────────┬──────────────────────────────┘         │
└─────────────────────────┼────────────────────────────────────┘
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
│  │ renderer.ts  │  │   state.ts   │  │  search.ts   │     │
│  │   (Entry)    │  │  (State Mgmt)│  │  (Search)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │              Service Layer                          │    │
│  │   fileService.ts  │  markdownService.ts            │    │
│  └─────────────────────────────────────────────────────┘    │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────┐   │
│  │              Module Layer                            │   │
│  │  editor.ts │ preview.ts │ fileTree.ts │ autosave.ts │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────┐   │
│  │              Web Workers                             │   │
│  │  htmlToMarkdown.worker.ts (HTML → Markdown)         │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

## Process Architecture

### Main Process (Node.js Environment)

The main process runs Node.js and has full access to system APIs. It is responsible for:

- **Application Lifecycle** (`app.ts`)
  - Window management
  - Application startup/shutdown
  - Event coordination
  - IPC handlers for file operations

- **Menu System** (`menu.ts`)
  - Application menu
  - Context menus
  - Menu item handlers
  - Recent files submenu

- **Security** (`security.ts`)
  - Path validation
  - Directory traversal prevention
  - Safe directory restrictions
  - Symlink validation

- **File Management** (`recent-files.ts`)
  - Recent files list (max 10)
  - File persistence to JSON
  - Async and sync operations

- **Configuration** (`config.ts`)
  - User preferences
  - Application settings
  - Persistent configuration
  - Theme and font settings

- **Keyboard Shortcuts** (`shortcuts.ts`)
  - Global shortcut registration
  - Shortcut conflict resolution

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
  on: (channel, callback) => {
    // Validate channel is whitelisted for receiving
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
  // ... other safe APIs
});
```

### Renderer Process (Browser Environment)

The renderer process runs in a Chromium browser context with no direct Node.js access:

#### UI Layer
- **`renderer.ts`**: Main entry point, coordinates all modules
- **`state.ts`**: Centralized state management with event-driven updates

#### Service Layer
- **`fileService.ts`**: File operations abstraction (load, save, create, delete)
- **`markdownService.ts`**: Markdown parsing, rendering, and HTML→Markdown conversion
  - LRU caching (100 entries)
  - Content hash-based caching
  - DOMPurify sanitization
  - Web Worker integration for large content

#### Module Layer
- **`editor.ts`**: Markdown editor functionality
  - Text input handling
  - HTML→Markdown paste conversion
  - Scroll and cursor position preservation

- **`preview.ts`**: Preview pane with live rendering
  - Markdown to HTML rendering
  - Read-only preview mode
  - Scroll synchronization

- **`fileTree.ts`**: File explorer tree view
  - Folder expand/collapse
  - File/folder indicators (empty vs. populated)
  - Context menu operations
  - Horizontal scrolling for long filenames

- **`autosave.ts`**: Automatic file saving
  - Configurable intervals (default: 30s)
  - Dirty state tracking
  - Status indicator

#### Search
- **`search.ts`**: File content search
  - LRU caching (50 entries)
  - fast-glob for efficient scanning
  - Pattern matching with context

#### Web Workers
- **`workers/htmlToMarkdown.worker.ts`**: Offloads heavy HTML→Markdown conversion
  - Threshold: ≥10KB content
  - 5-second timeout with sync fallback
  - DOMPurify sanitization in worker

#### Performance Utilities
- **`utils/performance.ts`**: Performance optimization utilities
  - Debouncing/throttling
  - LRU caching implementation
  - Content hash function (FNV-1a)
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
4. XSS via markdown/pasted HTML content
5. Malicious file operations

**Mitigations:**
1. Path validation in `security.ts`
2. Sandboxed renderer process
3. Whitelisted IPC channels
4. Content Security Policy (CSP)
5. **DOMPurify HTML sanitization** (v0.0.4+)
6. Sanitized markdown rendering

### Security Layers

1. **Process Isolation**
   - Renderer runs in sandbox
   - No direct Node.js access
   - Context isolation enabled

2. **IPC Channel Whitelisting**
   - Only allowed channels work
   - All others rejected silently
   - Separate whitelists for send/receive

3. **Path Validation**
   - All paths validated before use
   - Restricted to safe directories
   - Null byte sanitization
   - Symlink validation

4. **Content Security**
   - CSP headers set in HTML
   - **DOMPurify sanitization** for all pasted HTML
   - Safe HTML rendering in preview
   - Script tags and event handlers stripped

5. **HTML Sanitization** (v0.0.4+)
   ```typescript
   // All HTML pasted into editor is sanitized
   const sanitizedHtml = DOMPurify.sanitize(html);
   const markdown = await htmlToMarkdown(sanitizedHtml);
   ```
   
   **DOMPurify Configuration:**
   - Strips script tags
   - Removes event handlers (onclick, onerror, etc.)
   - Blocks dangerous protocols (javascript:, data:)
   - Allows safe HTML subset for markdown conversion

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
   - **Key: content hash (FNV-1a algorithm)**
   - Avoids expensive re-parsing
   - Memory efficient for large content

3. **Recent Files Cache** (In-memory, 10 entries)
   - Quick access to recent files
   - Persisted to disk

### Web Workers (v0.0.4+)

**Purpose:** Offload heavy HTML→Markdown conversion from main thread

**Implementation:**
- **File:** `workers/htmlToMarkdown.worker.ts`
- **Threshold:** Content ≥10KB uses worker
- **Communication:** `postMessage` API
- **Timeout:** 5 seconds with sync fallback
- **Error Handling:** Graceful degradation to sync conversion

**Benefits:**
- Prevents UI blocking for large content
- Maintains responsiveness during paste operations
- Automatic fallback for worker errors

### Content Hash-Based Caching (v0.0.4+)

**Algorithm:** FNV-1a (Fast, non-cryptographic hash)

**Implementation:**
```typescript
function hashContent(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}
```

**Benefits:**
- Memory efficient (hash vs. full content as key)
- Fast hash computation
- Consistent caching for duplicate content

### Debouncing

- Search inputs debounced (300ms)
- Configuration saves debounced (1000ms)
- Preview updates debounced (300ms)
- Autosave state synchronization debounced (500ms)

### Throttling

- Scroll position updates throttled
- File tree render updates throttled
- IPC message rate limiting

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
│   ├── search.test.ts
│   └── markdown.test.ts
├── integration/       # Integration tests
│   └── ipc.test.ts
├── renderer/          # Renderer tests
│   ├── preview.test.ts
│   └── markdownService.test.ts
└── e2e/              # End-to-end tests (future)
```

### Test Coverage (v0.0.4)

- **Total Tests:** 139 passing tests
- **Overall Coverage:** ~40%
- **Target Coverage:** 80%+

**Coverage by Area:**
- Main process core: ~60%
- Security utilities: ~95%
- Service layer: ~55%
- Renderer modules: ~30%

**Focus Areas for Improvement:**
- `renderer.ts`: Add integration tests
- `editor.ts`: Add unit tests
- `autosave.ts`: Add unit tests
- `fileTree.ts`: Add unit tests

### CI/CD Integration

- **GitHub Actions:** Automated testing on push
- **Multi-platform:** Ubuntu and macOS
- **Node Versions:** 18.x and 20.x
- **Coverage Reports:** Codecov integration
- **Build Verification:** Packaging tests

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

### v0.1.0 (Q2 2026) - Planned

1. **Enhanced Search Navigation**
   - Next/previous match navigation
   - Auto-scroll to matched text
   - Keyboard shortcuts (F3, Shift+F3)

2. **Recent Files Enhancements**
   - Cmd+Tab shortcut for switching recent files
   - Filter by root directory
   - Visual recent files panel

3. **Settings UI**
   - Dedicated settings panel
   - Customizable themes (dark mode)
   - Font preferences
   - Autosave configuration

### v0.2.0 (Q3 2026) - Planned

1. **Enhanced Preview Mode**
   - Editable preview with live rendering
   - Side-by-side view option
   - Customizable preview themes

2. **Productivity Features**
   - Table of contents generation
   - Word count and reading time
   - Export to PDF/HTML
   - Multiple tabs support

3. **Advanced Editing**
   - Markdown table editor
   - Image drag-and-drop
   - Image upload to cloud storage
   - Link checker
   - Spell checker integration

### v0.3.0+ (Future) - Under Consideration

1. **Collaboration Features** (Optional)
   - Real-time collaboration
   - Document sharing
   - Comment and suggestion mode
   - Version history

2. **Extensions & Plugins**
   - Plugin system architecture
   - Custom markdown renderers
   - Third-party tool integration
   - Public API for extensions

3. **Performance Enhancements**
   - Virtual scrolling for large files (>10,000 lines)
   - Lazy loading for preview images
   - Optimized re-rendering in preview mode
   - Code splitting for faster startup

4. **Accessibility**
   - ARIA labels for UI elements
   - Keyboard navigation improvements
   - Screen reader support
   - High contrast themes

5. **Internationalization**
   - i18n framework integration
   - Multi-language support
   - RTL text support

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

### Documentation
- [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) - Complete development roadmap
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [README.md](../README.md) - Project overview

### External Resources
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML sanitization
- [Marked.js](https://marked.js.org/) - Markdown parser
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [fast-glob](https://github.com/mrmlnc/fast-glob) - File scanning
- [esbuild](https://esbuild.github.io/) - Fast bundling

---

**Last Updated:** March 17, 2026  
**Version:** v0.0.4  
**Maintained by:** Markit Development Team
