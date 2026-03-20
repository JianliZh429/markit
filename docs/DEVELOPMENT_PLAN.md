# Markit Development Plan

**Last Updated:** March 20, 2026  
**Current Version:** v0.0.8  
**Status:** Core Features Complete

---

## Overview

For version history and release notes, see the [CHANGELOG](../CHANGELOG.md).

This document tracks the development roadmap and future plans for Markit.

---

## Feature Status

### ✅ Completed (v0.0.1 - v0.0.8)

All core features are complete including:
- Core editing (dual-mode, smart paste, syntax highlighting)
- File management (explorer, operations, recent files)
- Search & navigation (local and global search)
- Performance optimization (caching, Web Workers)
- Security (sanitization, path validation)
- Platform support (macOS Intel/Apple Silicon, Linux)
- Developer experience (TypeScript, CI/CD, tests)

See [CHANGELOG](../CHANGELOG.md) for detailed version history.

---

### 🚧 In Progress

#### Documentation
- [ ] Video tutorials
- [ ] Migration guide from other editors

---

### 📋 Planned Features

#### v0.1.0 (Q2 2026) - Productivity
- [ ] Table of contents generation
- [ ] Word count and reading time
- [ ] Export to PDF/HTML
- [ ] Print support
- [ ] Multiple tabs for multiple files

#### v0.2.0 (Q3 2026) - Advanced Editing
- [ ] Markdown table editor
- [ ] Image drag-and-drop
- [ ] Image upload to cloud storage
- [ ] Link checker
- [ ] Spell checker integration

#### v0.3.0 (Future) - Collaboration
- [ ] Real-time collaboration
- [ ] Document sharing
- [ ] Comment and suggestion mode
- [ ] Version history

#### v0.4.0 (Future) - Extensions & Plugins
- [ ] Plugin system
- [ ] Custom markdown renderers
- [ ] Integration with external tools
- [ ] API for third-party extensions

#### v0.5.0 (Future) - Live Editing
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
   - Focus areas: renderer.ts, editor.ts, autosave.ts

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
   - Multi-language support
   - RTL text support

---

## Key Metrics

### Current Status
- **Version:** 0.0.8
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

MIT License - See [LICENSE](LICENSE) file for details.

**Markit** - A modern Markdown editor for focused writing.
