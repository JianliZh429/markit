# Markit Improvement Plan

**Created:** May 10, 2026
**Current Version:** v0.3.2
**Status:** Draft

---

## Executive Summary

Markit is a functional Electron-based Markdown editor at v0.3.2 with a solid foundation: dual-mode editing, file explorer, search, settings, and cross-platform packaging. The primary improvement opportunities are:

1. **renderer.ts is a god file** (47KB, 1507 lines) containing event handlers, modals, IPC wiring, search, settings, recent files, export, and initialization all in one file
2. **Test coverage at ~40%** — critical modules (editor.ts, autosave.ts, fileTree.ts, toc.ts, renderer.ts) lack tests
3. **Stale documentation** — ARCHITECTURE.md references v0.0.4, DEVELOPMENT_PLAN.md references v0.3.0 while package.json says 0.3.2
4. **CI/CD issues** — matrix syntax errors in test.yml (`runs-on: ubuntu-latest, macos-latest` is invalid YAML)
5. **No Windows support** — only macOS and Linux are packaged

---

## Priority 1: Code Architecture & Maintainability

### 1.1 Extract God File — `renderer.ts` Refactoring

**Problem:** `renderer.ts` is 1507 lines (47KB) mixing 8+ concerns:
- DOM element grabbing (lines 50-124)
- Module initialization (lines 126-176)
- Mode switching (lines 240-323)
- Local search (lines 503-519)
- Global search (lines 524-600)
- IPC event handlers (lines 617-913)
- Recent files switcher modal (lines 916-1180)
- Settings modal (lines 1182-1352)
- Keyboard shortcuts modal (lines 1354-1382)
- Export modal (lines 1384-1443)
- Insert table modal (lines 1449-1497)
- Utility functions (loadFile, unloadFile, scrollToSection, etc.)

**Solution:** Extract each modal and feature domain into separate orchestrator files under `markit/renderer/orchestrators/`:

| Extracted File | Responsibility | Estimated Lines |
|---|---|---|
| `orchestrators/settingsOrchestrator.ts` | Settings modal, load/save/reset, apply to UI | ~180 |
| `orchestrators/recentFilesOrchestrator.ts` | Cmd+Tab modal, recent files list, navigation | ~250 |
| `orchestrators/exportOrchestrator.ts` | Export modal, HTML export flow | ~100 |
| `orchestrators/tableOrchestrator.ts` | Insert table modal + TableEditor integration | ~80 |
| `orchestrators/searchOrchestrator.ts` | Local/global search UI wiring (keep searchManager.ts for logic) | ~150 |
| `orchestrators/shortcutsOrchestrator.ts` | Keyboard shortcuts modal, global keybindings | ~80 |
| `orchestrators/ipcHandlers.ts` | All ipcOn() registrations, organized by category | ~200 |

After extraction, `renderer.ts` becomes a coordinator that initializes modules and wires them together (~300 lines).

**Risk:** Medium — requires careful tracking of shared dependencies (stateManager, editorModule, fileService, etc.). Pass these via constructor or a shared context object.

### 1.2 State Management Improvements

**Problem:** `state.ts` has a simple event-driven state manager but:
- `AppState` mixes UI state (isExplorerVisible) with domain state (currentFilePath)
- No persistence — state resets on reload
- `selectedTreeNode: HTMLElement | null` leaks DOM into state layer

**Solutions:**
- Split state into `UiState` (panel visibility, search visibility) and `DocumentState` (file path, root directory, scroll positions)
- Remove DOM references from state — use element IDs or data attributes instead
- Add state persistence layer (serialize to userData on shutdown, restore on startup)

### 1.3 Replace `any` Types

**Problem:** renderer.ts line 31 uses `(window as any).electronAPI`. Multiple places use `any` for search results and IPC args.

**Solution:**
- The preload types are already declared in `types/preload.d.ts` — reference them properly instead of casting to `any`
- Define proper interfaces for IPC message payloads
- Enable `noImplicitAny` and `strict: true` in tsconfig.json if not already set

### 1.4 Duplicate Code — `loadFile` vs `loadFileContentOnly`

**Problem:** `loadFile()` (line 433) and `loadFileContentOnly()` (line 1016) are 80% identical — both set base URL, load file content, update TOC, update word count, switch to preview mode, set title.

**Solution:** Extract a shared `openDocument(filePath: string, options?: { rebuildTree?: boolean })` function with a flag to control tree rebuild behavior.

---

## Priority 2: Test Coverage

### 2.1 Current Coverage Gaps

| Module | Estimated Coverage | Status |
|---|---|---|
| renderer.ts | 0% | No tests |
| editor.ts | 0% | No tests |
| autosave.ts | 0% | No tests |
| fileTree.ts | 0% | No tests |
| toc.ts | 0% | No tests |
| wordCount.ts | 0% | No tests |
| lineNumbers.ts | 0% | No tests |
| tableEditor.ts | 0% | No tests |
| exportService.ts | 0% | No tests |
| fileService.ts | Partial | May have indirect coverage |
| markdownService.ts | ~55% | Has tests |
| search.ts | Partial | Has tests |
| security.ts | ~95% | Well covered |
| config.ts | Low | Minimal tests |
| recent-opens.ts | Covered | Has tests |

### 2.2 Testing Strategy

**Phase 1: Unit tests for pure modules (quick wins)**
- `wordCount.ts` — pure text analysis, trivial to test
- `toc.ts` — heading extraction and slug generation
- `lineNumbers.ts` — line number rendering logic
- `tableEditor.ts` — markdown table string generation

**Phase 2: Service layer tests**
- `fileService.ts` — mock electronAPI.fs, test load/save/create/delete/rename
- `exportService.ts` — test HTML generation with various markdown inputs
- `autosave.ts` — mock timers, test save triggers

**Phase 3: Module integration tests**
- `editor.ts` — test paste handling, content management, cursor position
- `fileTree.ts` — test tree building, expand/collapse, context menu actions

**Phase 4: renderer.ts integration tests**
- After refactoring (1.1), test each orchestrator independently
- Test mode switching flow
- Test file loading flow

### 2.3 Add E2E Tests

**Tool:** Playwright for Electron
**Test cases:**
1. Open app → open file → verify content loads
2. Edit file → save → verify file on disk
3. Switch to preview mode → verify rendering
4. Create new file via explorer → rename → delete
5. Search in document → find next → find previous
6. Settings → change theme → verify applied
7. Export to HTML → verify file created

---

## Priority 3: CI/CD Fixes

### 3.1 Fix Invalid Matrix Syntax

**Problem in `test.yml` lines 63 and 120:**
```yaml
runs-on: ubuntu-latest, macos-latest  # INVALID
```
This is not valid GitHub Actions syntax. Should use a matrix:
```yaml
runs-on: ${{ matrix.os }}
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
```

### 3.2 Add Node.js 22.x to Test Matrix

Node.js 18.x is entering maintenance. Add 22.x and consider dropping 18.x.

### 3.3 Add Windows to CI Matrix

Since Windows packaging is not yet implemented, at minimum run lint + tests on `windows-latest` to catch platform-specific issues.

### 3.4 Dependabot Auto-Merge for Patch Updates

Update `.github/dependabot.yml` to auto-merge security patches.

### 3.5 Add Release Automation

**Current state:** Manual packaging with `npm run installer`.
**Improvement:** GitHub Actions workflow that:
- On git tag `v*`, runs `npm run installer`
- Uploads DMG, DEB, and ZIP artifacts to GitHub Release
- Generates changelog from git log

---

## Priority 4: Feature Enhancements

### 4.1 Split-View Mode (Side-by-Side)

**Description:** Show editor and preview simultaneously with a resizable divider.
**Implementation:**
- Add `split` as a third mode alongside `edit` and `preview`
- CSS flex layout with a draggable divider
- Sync scroll between left (editor) and right (preview) panels
**Difficulty:** Medium

### 4.2 Find-in-Document Improvements

**Current behavior:** Local search replaces the entire editor content with highlighted HTML in a separate panel.
**Issues:**
- `localSearch()` on line 503 uses a single regex with `gi` flag, ignoring the caseSensitive and useRegex options
- Replace functionality is handled by `searchManager.ts` but the search result display is disconnected
- No match counter (e.g., "3 of 12")
- No visual highlighting within the actual textarea

**Improvements:**
- Fix caseSensitive and useRegex to actually affect the regex construction
- Add match counter
- Highlight matches within the textarea (requires overlay approach or contenteditable)

### 4.3 Windows Support

**Current state:** Only macOS and Linux packaging.
**Improvement:**
- Add `package:win` script using electron-packager
- Create NSIS installer via `electron-installer-windows` or switch to `electron-builder` (which handles all platforms with one config)
- Add Windows-specific icon (.ico)

**Recommendation:** Switch from `electron-packager` + `electron-installer-*` to `electron-builder`. It produces DMG, DEB, and NSIS from a single config, and is the industry standard for Electron apps.

### 4.4 Auto-Update Mechanism

**Description:** Use `electron-updater` (part of electron-builder) for automatic update checks and downloads.
**Implementation:**
- Add `electron-updater` dependency
- Configure update server (GitHub Releases)
- Add "Check for Updates" menu item
- Show update notification on startup

### 4.5 Git Integration

**Description:** Show Git status (modified, untracked, staged) next to files in the explorer.
**Implementation:**
- Use `simple-git` or `isomorphic-git` in the main process
- Add IPC channel for git status
- Display status indicators in fileTree.ts
**Difficulty:** Medium-High

---

## Priority 5: Documentation & Developer Experience

### 5.1 Update Stale Documentation

| Document | Issue | Fix |
|---|---|---|
| `docs/ARCHITECTURE.md` | References v0.0.4, architecture diagram outdated | Update to reflect current modules (toc, wordCount, lineNumbers, tableEditor, exportService, searchManager) |
| `docs/DEVELOPMENT_PLAN.md` | References v0.3.0, version is 0.3.2 | Bump version, mark completed items |
| `README.md` | Version says 0.3.0, Electron says 38.2.2 | Update to 0.3.2 and 39.x |
| `docs/API.md` | Unknown content | Review and update |

### 5.2 Add .gitignore Entries

**Check for:** `coverage/`, `dist/`, `build/`, `node_modules/` should be in `.gitignore`. If `build/installer/*.dmg` and `build/installer/*.deb` are committed, they should be ignored (installer binaries are release artifacts, not source).

### 5.3 Add Pre-commit Hooks

**Tool:** Husky + lint-staged
**Hooks:**
- `pre-commit`: Run `npm run lint` and `npm test` on staged files
- `pre-push`: Run full test suite

### 5.4 Add EditorConfig

Add `.editorconfig` for consistent formatting across editors:
```
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### 5.5 Add CHANGELOG Automation

Use `conventional-changelog` or `auto-changelog` to generate CHANGELOG.md from conventional commit messages.

---

## Priority 6: Performance

### 6.1 Virtual Scrolling for File Tree

**Problem:** `fileTree.ts` (15KB) renders all files as DOM elements. Large directories (1000+ files) will cause performance issues.
**Solution:** Implement virtual scrolling — only render visible items + buffer.
**Difficulty:** High

### 6.2 Debounce Preview Rendering

**Current:** Check if debouncing is applied to preview updates on every keystroke. If not, add a 150ms debounce.
**Impact:** Reduces CPU usage during fast typing.

### 6.3 Memory Leak Audit

**Check for:**
- Event listeners not cleaned up on module unload
- DOM elements held in module state after file close
- LRU cache size limits being appropriate

---

## Implementation Roadmap

### Phase 1: Quick Wins (Week 1-2)
1. Fix CI/CD matrix syntax errors
2. Update stale documentation
3. Add .editorconfig
4. Add unit tests for wordCount, toc, lineNumbers, tableEditor
5. Fix `localSearch()` caseSensitive/useRegex bug

### Phase 2: Architecture Refactoring (Week 3-5)
1. Extract renderer.ts into orchestrators (1.1)
2. Deduplicate loadFile/loadFileContentOnly
3. Replace `any` types with proper interfaces
4. Add unit tests for extracted orchestrators

### Phase 3: Testing & Quality (Week 6-8)
1. Unit tests for editor, autosave, fileService, exportService
2. Integration tests for fileTree, search
3. Set up Husky pre-commit hooks
4. Target 70%+ test coverage

### Phase 4: Features & Polish (Week 9-12)
1. Switch to electron-builder for cross-platform packaging
2. Add Windows support
3. Split-view mode
4. Auto-update mechanism
5. E2E tests with Playwright

### Phase 5: Future (Post-v0.4.0)
1. Git integration
2. Virtual scrolling for file tree
3. Plugin system (v0.6.0 plan)
4. Real-time collaboration (v0.5.0 plan)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| renderer.ts refactoring breaks functionality | High | Extract incrementally, test each module before removing from renderer.ts |
| electron-builder migration breaks existing packaging | Medium | Run both packagers in parallel for one release cycle |
| Adding E2E tests flaky on CI | Medium | Use Playwright's built-in retries, avoid timing-dependent assertions |
| Split-view increases complexity | Low | Implement as optional feature behind a setting |

---

## Appendix: File Size Analysis

| File | Lines | Size | Risk Level |
|---|---|---|---|
| renderer.ts | 1507 | 47KB | **High** — god file |
| fileTree.ts | ~500 | 15KB | Medium |
| preview.ts | ~550 | 17KB | Medium |
| app.ts | ~400 | 12KB | Low-Medium |
| editor.ts | ~350 | 11KB | Low |
| searchManager.ts | ~300 | 9KB | Low |
| markdownService.ts | ~300 | 10KB | Low |
| preload.ts | ~280 | 9KB | Low |
| security.ts | ~200 | 6KB | Low |

**Total source files:** 26 TypeScript files
**Total source size:** ~200KB (excluding node_modules and build artifacts)
