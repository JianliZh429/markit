# Markit Development Plan

**Last Updated:** March 21, 2026
**Current Version:** v0.1.0
**Status:** v0.1.0 Release Ready

---

## Overview

For version history and release notes, see the [CHANGELOG](../CHANGELOG.md).

This document tracks the development roadmap and future plans for Markit.

---

## Feature Status

### ✅ Completed (v0.1.0)

All features from v0.0.1-v0.0.8 have been consolidated and enhanced in v0.1.0:

#### Core Editing
- ✅ Dual-mode editing (Editor ↔ Preview)
- ✅ Real-time markdown preview with syntax highlighting
- ✅ Smart paste with HTML-to-Markdown conversion
- ✅ State preservation (scroll position, cursor location across mode switches)
- ✅ Floating mode indicator with icons

#### File Management
- ✅ File explorer with tree view
- ✅ Folder navigation with expand/collapse
- ✅ File operations (create, rename, delete)
- ✅ Recent files tracking (session-based per folder)
- ✅ Recent Files Switcher modal (Cmd/Ctrl + Tab)
- ✅ Recent Opens menu (persistent project-level)
- ✅ Single-click folder expand and file load
- ✅ Horizontal scrolling for long filenames
- ✅ Folder content indicators (empty vs. has children)

#### Search & Navigation
- ✅ Local search within current document
- ✅ Global search across all files in directory
- ✅ Fast file scanning powered by fast-glob
- ✅ Search result highlighting and context
- ✅ **Table of Contents generation** (NEW in v0.1.0)
- ✅ **Unicode support for CJK headings** (NEW in v0.1.0)
- ✅ **TOC panel with auto-Explorer toggle** (NEW in v0.1.0)
- ✅ **Click TOC headings to scroll in edit/preview modes** (NEW in v0.1.0)

#### Settings & Customization
- ✅ Settings modal with appearance, editor, and autosave options
- ✅ Theme selection (Light, Dark, Auto system preference)
- ✅ Font family customization (Monospace, System UI, Georgia, Arial, Times New Roman)
- ✅ Font size adjustment (10-24px range)
- ✅ Autosave toggle and interval configuration (5-300 seconds)

#### Markdown Extensions
- ✅ Emoji support via marked-emoji
- ✅ Code preview via marked-code-preview
- ✅ Base URL resolution via marked-base-url
- ✅ **Heading ID generation for anchor links** (NEW in v0.1.0)

#### Platform Support
- ✅ Native Apple Silicon (arm64) support
- ✅ Intel Mac (x64) support
- ✅ Linux (x64) support
- ✅ DMG installer for macOS
- ✅ DEB package for Linux

#### Security
- ✅ DOMPurify integration for HTML sanitization
- ✅ XSS prevention for pasted content
- ✅ Path validation and sandboxed renderer
- ✅ IPC channel whitelisting

#### Performance
- ✅ Async HTML to Markdown conversion with Web Workers
- ✅ Content hash-based caching strategy
- ✅ LRU caching for rendered markdown
- ✅ Optimized re-rendering in preview mode

#### Developer Experience
- ✅ TypeScript (100% coverage)
- ✅ Comprehensive test suite (139 tests)
- ✅ CI/CD pipeline with GitHub Actions
- ✅ ESLint and Prettier integration

See [CHANGELOG](../CHANGELOG.md) for detailed version history.

---

### 📋 Planned Features

#### v0.2.0 (Q3 2026) - Productivity
- ✅ Word count and reading time
- ✅ Export to HTML
- ~~Print support~~ (Completed via HTML export - users can print HTML to PDF using browser)
- [ ] Multiple tabs for multiple files (Moved to future)

#### v0.3.0 (Q4 2026) - Advanced Editing
- [ ] Markdown table editor
- [ ] Image drag-and-drop
- [ ] Image upload to cloud storage
- [ ] Link checker
- [ ] Spell checker integration

#### v0.4.0 (Future) - Collaboration & Advanced Features
- [ ] Multiple tabs for multiple files
- [ ] Real-time collaboration
- [ ] Document sharing
- [ ] Comment and suggestion mode
- [ ] Version history

#### v0.4.0 (Future) - Collaboration
- [ ] Real-time collaboration
- [ ] Document sharing
- [ ] Comment and suggestion mode
- [ ] Version history

#### v0.5.0 (Future) - Extensions & Plugins
- [ ] Plugin system
- [ ] Custom markdown renderers
- [ ] Integration with external tools
- [ ] API for third-party extensions

#### v0.6.0 (Future) - Live Editing
- [ ] Refactor corresponding variables and functions
   - [ ] Change `Edit` mode to `Markdown` mode (editor.ts → markdown-renderer.ts)
   - [ ] Change `Preview` mode to `Html` mode (preview.ts → html-renderer.ts)
- [ ] Make HTML mode editable
   - Changes convert to Markdown when switching modes
   - Changes save to file as markdown format
- [ ] Markdown mode remains editable
   - Changes convert to HTML when switching modes
- [ ] Autosave works for both modes

---

## Technical Debt & Improvements

### High Priority

1. **Test Coverage**
   - Current: ~40% overall
   - Target: 80%+ coverage
   - Focus areas: renderer.ts, editor.ts, autosave.ts, toc.ts

2. **Dependency Updates**
   - Electron: 38.x → Latest stable
   - marked: 16.x → 17.x (breaking changes)
   - esbuild: 0.25.x → 0.27.x

3. **Performance**
   - Virtual scrolling for large files (>10,000 lines)
   - Lazy loading for preview images
   - Optimized re-rendering in preview mode

### Medium Priority

1. **Code Quality**
   - Add JSDoc comments to public APIs
   - Implement error boundaries
   - Add loading states for async operations

2. **Accessibility**
   - ARIA labels for UI elements
   - Keyboard navigation improvements
   - Screen reader support

3. **Internationalization**
   - i18n framework integration
   - Multi-language UI support
   - RTL text support

---

## Key Metrics

### Current Status (v0.1.0)
- **Version:** 0.1.0
- **Test Coverage:** ~40% overall
- **Test Count:** 139 passing tests
- **TypeScript Coverage:** 100%
- **Platforms:** macOS (x64/arm64), Linux (x64)

### Performance Targets
- **Startup Time:** < 2 seconds
- **File Load:** < 500ms for 10KB files
- **Preview Render:** < 100ms for typical documents
- **Memory Usage:** < 200MB for typical usage

### Quality Targets
- **Test Coverage:** 80%+
- **Lint Errors:** 0
- **Build Warnings:** 0
- **Critical Bugs:** 0

---

## License

MIT License - See [LICENSE](../LICENSE) file for details.

**Markit** - A modern Markdown editor for focused writing.
