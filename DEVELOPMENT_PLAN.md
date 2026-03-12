# Development Plan for MarkIt

## 1. Critical Security Fixes

| Area | Issue | Fix | Priority |
|------|-------|-----|----------|
| `main/security.ts` | Path‑safety logic rejects legitimate paths because it required `relativePath` to be truthy. | Rewrite the check to treat an empty string (exact base directory) as safe and only reject when the relative path starts with `..` or is absolute. | **High** |
| `main/security.ts` | No markdown‑extension enforcement – users could save any file type. | After sanitising the path, call `isMarkdownFile` and throw if the extension is not `.md` or `.markdown`. | **High** |
| `main/security.ts` | Symlink bypass – `path.resolve` does not follow symlinks. | Resolve the real path with `fs.promises.realpath` (or sync) before the base‑directory check. | **Medium** |
| `main/app.ts` (dialog handlers) | Missing `win` guard for the *save‑file‑dialog* handler. | Add `if (!win) return;` guard like the other handlers. | **Medium** |
| `main/app.ts` | No prompt for unsaved changes on window close. | Add a `close` listener that asks the renderer if there are dirty edits and cancels the close if necessary. | **Medium** |

## 2. File‑System & I/O Improvements

- **Cache key optimisation** – Change `MarkdownService` cache to use a hash of the content instead of the raw string to reduce memory usage.
- **HTML‑to‑Markdown sanitisation** – Run pasted HTML through a sanitizer (e.g., DOMPurify) before conversion to mitigate XSS.
- **Async paste handling** – Perform large HTML‑to‑Markdown conversions off the main thread (Web Worker or `requestIdleCallback`).
- **Lazy loading of large directory trees** – Update the file‑tree UI to load sub‑folders on demand to keep the UI responsive.

## 3. Search Feature Enhancements

| Issue | Fix |
|-------|-----|
| `console.log` in production | Remove or guard with `NODE_ENV !== 'production'`. |
| Returned `line` is a character index, not a line number | Convert the character offset to a line number (`content.slice(0, matchIndex).split('\n').length`). |
| Synchronous file iteration blocks the event loop | Parallelise reads with `Promise.all` (with a concurrency limit). |
| No cancellation support | Accept an abort signal from the renderer (future improvement). |

## 4. State Management & Type Safety

- Add explicit TypeScript interfaces for the state manager (`EditorState`).
- Refactor `stateManager.setState` to accept `Partial<EditorState>`.
- Ensure `LRUCache` import uses TypeScript paths (no hard‑coded `.js`).
- Enable `strict` mode in `tsconfig.json` and fix any resulting type errors.

## 5. User Experience Features (in progress)

| Feature | Status | Notes |
|---------|--------|-------|
| **Autosave** | ✅ Completed | Saves hidden backups to `$HOME/.markit/autosave`, loads recent backup on startup if no file open |
| **Theme / Font size** | 🚧 In progress | planned: JSON config, toggle dark/light mode |
| **Export (PDF/HTML)** | ⏳ Pending | use Electron’s `printToPDF` or write HTML file |
| **Undo/Redo persistence** | ⏳ Pending | store stack in localStorage |
| **Better encoding handling** | ⏳ Pending | detect UTF‑8 BOM |
| **Improved documentation** | ⏳ Pending | add *Security Considerations* to README |

### Completed improvements (branch `improvements`)

| Commit | Change |
|--------|--------|
| `Fix path safety logic` | Treat exact base directory as safe, allow legitimate paths |
| `Add markdown‑file validation` | Reject non‑`.md`/`.markdown` files in save dialogs |
| `Improve autosave` | Write hidden backups with `mkdirSync({recursive:true})` |
| `Enable autosave on startup` | Load recent backup if no file currently open, auto‑enable with 30s interval |

## 6. Testing & CI

- Add unit tests for `validatePath` covering:
  - Empty string
  - Same‑directory path (should be accepted)
  - Path that climbs out with `..`
  - Symlink that points outside the safe base
  - Non‑markdown extensions
- Extend test suite to cover the enhanced search handler (line‑number conversion and parallel reads).
- Integrate a simple CI step that runs `npm run lint && npm test` on every push.

## 7. Linting & Build Hygiene

- Ensure `eslint` runs without warnings (fix any existing issues).
- Add a pre‑commit hook (husky) that runs `npm run lint`.
- Align module format: either stick to ESM (`import … from …`) with `"type": "module"` or convert everything to CommonJS. Consistency prevents runtime import errors.

---

**Remaining tasks** (in order of priority):
1. **Search handler improvements** – convert line index to line numbers, remove `console.log` in production, parallelise reads.
2. **Unit tests** – add tests for `validatePath` edge cases and security utilities.
3. **Theme / Settings UI** – add simple JSON config for theme, font size.
4. **Export (PDF/HTML)** – use Electron’s `printToPDF` or write HTML file.
5. **Pre‑commit hook** – add husky to run `npm run lint` on every push.

Feel free to tell me which item you’d like me to tackle next!