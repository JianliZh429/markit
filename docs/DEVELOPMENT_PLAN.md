# Markit Development Plan

**Last Updated:** March 18, 2026
**Current Version:** v0.0.7
**Status:** Active Development (~90% Complete)

---

## Executive Summary

Markit is a modern, cross-platform Markdown editor built with Electron and TypeScript. The application provides a clean, distraction-free writing experience with powerful features for managing and editing Markdown files.

### Recent Achievements (v0.0.7)

✅ **Recent Files Switcher (macOS Style)**
- Modal popup with `Ctrl/Cmd + Tab` shortcut
- Forward/backward navigation with `Tab` / `Shift + Tab`
- Circular navigation (wraps around)
- Opens selected file on key release
- Only active when folder root is opened
- Session-based tracking (per folder context)

✅ **Recent Opens Menu**
- Renamed from "Open Recent" to avoid confusion
- Shows persistently opened folders/files (project level)
- Accessible via File → Recent Opens menu

✅ **UI/UX Enhancements**
- Modern design system with CSS variables
- Enhanced file explorer with horizontal scrolling
- Folder content indicators (empty vs. has children)
- Custom scrollbars and improved typography
- Floating mode indicator with icons

✅ **Performance Improvements**
- Async HTML to Markdown conversion with Web Workers
- Content hash-based caching strategy
- LRU caching for rendered markdown

✅ **Security Enhancements**
- DOMPurify integration for HTML sanitization
- XSS prevention for pasted content
- Path validation and sandboxed renderer

✅ **Platform Support**
- Native Apple Silicon (arm64) support
- Intel Mac (x64) support
- Linux (x64) support
- Automated CI/CD pipeline

---

## Feature Completion Status

### ✅ Completed Features (90%)

#### Core Editing
- [x] Dual-mode editing (Editor ↔ Preview)
- [x] Real-time markdown preview
- [x] Smart paste with HTML-to-Markdown conversion
- [x] State preservation (scroll, cursor position)
- [x] Syntax highlighting for code blocks
- [x] Markdown extensions (emoji, base URL, code preview)

#### File Management
- [x] File explorer with tree view
- [x] Folder navigation with expand/collapse
- [x] File operations (create, rename, delete)
- [x] **Recent Opens** (persistent, project-level) - File → Recent Opens menu
- [x] **Recent Files Switcher** (session-based, folder-level) - `Ctrl/Cmd + Tab`
- [x] Folder content indicators
- [x] Horizontal scrolling for long filenames

#### Search & Navigation
- [x] Local search (within document)
- [x] Global search (across all files)
- [x] Fast file scanning (fast-glob)
- [x] Search result highlighting
- [x] Context-aware search results

#### Performance & Optimization
- [x] Web Workers for heavy HTML→Markdown conversion
- [x] Content hash-based caching
- [x] LRU cache for search results
- [x] Debouncing and throttling
- [x] Lazy loading for large content

#### Security
- [x] DOMPurify HTML sanitization
- [x] Path traversal prevention
- [x] IPC channel whitelisting
- [x] Sandboxed renderer
- [x] Content Security Policy (CSP)

#### Developer Experience
- [x] TypeScript migration (100%)
- [x] Comprehensive test suite (139 tests)
- [x] CI/CD pipeline with GitHub Actions
- [x] ESLint and Prettier integration
- [x] Automated packaging for all platforms

#### Platform Support
- [x] macOS (Intel x64)
- [x] macOS (Apple Silicon arm64)
- [x] Linux (x64)
- [x] DMG installer for macOS
- [x] DEB package for Linux

---

### 🚧 In Progress (8%)

#### Enhanced Search
- [x] Search in file, bind shortcut to move next and up matched text
- [x] Screen would scrolled to the matched text when the matched text is active

#### Recent Files (Session-Based)
- [x] Add shortcut `Ctrl/Cmd + Tab` to switch between recently opened files
- [x] Modal popup with macOS-style design
- [x] Forward navigation with `Ctrl/Cmd + Tab`
- [x] Backward navigation with `Ctrl/Cmd + Shift + Tab`
- [x] Circular navigation (wraps around at ends)
- [x] Open selected file on key release
- [x] Click to select and open file
- [x] Only active when folder root is opened (disabled for single file)
- [x] Recent files limited to current folder context
- [x] Tree view highlights and scrolls to selected file
- [x] File content loaded without rebuilding tree

#### Enhanced File Tree
- [x] Single click the icon of a folder, will expand the folder and show the sub-folders and files in it.
- [x] Single click the icon of a file, will load this file content to Preview/Editor, not reloading the file tree.

#### Advanced Settings
- [x] Settings UI panel
- [x] Customizable keyboard shortcuts
- [x] Theme customization (dark mode)
- [x] Font family and size preferences
- [x] Autosave interval configuration

#### Documentation
- [ ] User manual
- [ ] API documentation
- [ ] Video tutorials
- [ ] Migration guide from other editors

---

### 📋 Planned Features (5%)

#### v0.1.0 - Productivity Features
- [ ] Table of contents generation
- [ ] Word count and reading time
- [ ] Export to PDF/HTML
- [ ] Print support
- [ ] Multiple tabs for multiple files

#### v0.2.0 - Advanced Editing
- [ ] Markdown table editor
- [ ] Image drag-and-drop
- [ ] Image upload to cloud storage
- [ ] Link checker
- [ ] Spell checker integration

#### v0.3.0 - Collaboration (Future)
- [ ] Real-time collaboration (optional)
- [ ] Document sharing
- [ ] Comment and suggestion mode
- [ ] Version history

#### v0.4.0 - Extensions & Plugins
- [ ] Plugin system
- [ ] Custom markdown renderers
- [ ] Integration with external tools
- [ ] API for third-party extensions

#### v0.5.0 Live editing
- [ ] Refactor: refactor the cooresponding variables and functions
   - [ ] Change `Edit` mode related to be `Markdown` mode, such as editor.ts -> markdown-renderer.ts, editMode -> markdownMode
   - [ ] Change `Preview` mode related to `Html` mode, such as preview.ts -> html->renderer.ts, previewMode -> htmlMode
- [ ] Make htmlMode editable
   - Which is editing the rendered Html
   - Changes made in this mode should be converted to Markdown format when switch to markdownMode
   - Changes made in this mode can be saved to the opened file as markdown format 
- [ ] Markdown mode is still editable
   - Which is editing the markdown text
   - Chagnes made in this mode should be converted to Html format when switch to htmlMode
   - Changes made in this mode can be saved to the opened file as markdown format
- [ ] Autosave should work for both mode

#### Customization
- [ ] Customize the theme for both mode
- [ ] Customize the shortcuts key bindings

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

## Release Schedule

### v0.0.7 (Current) - ✅ Released
- Recent Files Switcher (macOS style modal)
- Recent Opens menu (renamed from Open Recent)
- Session-based recent files tracking
- Tree view integration for recent files

### v0.0.6 - ✅ Released
- UI/UX enhancements
- Apple Silicon support
- Security improvements
- Performance optimizations

### v0.1.0 (Q2 2026) - Planned
- Productivity features
- Enhanced settings UI
- Export capabilities
- Tab support

### v0.2.0 (Q3 2026) - Planned
- Advanced editing features
- Image management
- Link checker
- Spell checker

### v1.0.0 (Q4 2026) - Target
- Feature complete
- Stable release
- Comprehensive documentation
- Full test coverage

---

## Key Metrics

### Current Status
- **Version:** 0.0.7
- **Test Coverage:** ~40%
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

## Contribution Guidelines

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint rules enforced
- Prettier formatting
- Meaningful commit messages

### Testing Requirements
- Unit tests for new features
- Integration tests for workflows
- Manual testing on all platforms
- Performance regression testing

---

## Contact & Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/JianliZh429/markit/issues)
- **Discussions:** [Community discussions](https://github.com/JianliZh429/markit/discussions)
- **Email:** [Project maintainer contact]

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

**Markit** - A modern Markdown editor for focused writing.
