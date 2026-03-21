# Changelog

All notable changes to Markit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.0.8] - March 20, 2026

### Added
- **Documentation**
  - Complete User Manual with usage guide, shortcuts, and troubleshooting
  - API Documentation for developers with technical reference
- **Enhanced File Tree**
  - Single-click on folder icon to expand/collapse directories
  - Single-click on file icon to load content without rebuilding tree
- **Settings Feature**
  - Settings modal UI with appearance, editor, and autosave options
  - Theme selection (Light, Dark, Auto system preference)
  - Font family customization (Monospace, System UI, Georgia, Arial, Times New Roman)
  - Font size adjustment (10-24px range)
  - Autosave toggle and interval configuration (5-300 seconds)
- **Keyboard Shortcuts**
  - `Cmd/Ctrl + ,` to open Settings

### Changed
- Increased icon click area in file tree from 16px to 24px for better usability
- Updated button hover states for better visibility

### Fixed
- Settings modal button hover color (no longer turns white on hover)
- Font size CSS variable (`--font-size`) now properly defined and applied
- Font family now correctly applies to both editor and preview panes

---

## [0.0.7] - March 18, 2026

### Added
- **Recent Files Switcher (macOS Style)**
  - Modal popup with `Ctrl/Cmd + Tab` shortcut
  - Forward/backward navigation with `Tab` / `Shift + Tab`
  - Circular navigation (wraps around)
  - Opens selected file on key release
  - Only active when folder root is opened
  - Session-based tracking (per folder context)
- **Recent Opens Menu**
  - Renamed from "Open Recent" to avoid confusion
  - Shows persistently opened folders/files (project level)
  - Accessible via File → Recent Opens menu
- **Tree View Integration**
  - Recent files modal highlights and scrolls to selected file
  - File content loaded without rebuilding tree

### Changed
- Renamed "Open Recent" menu to "Recent Opens" for clarity

---

## [0.0.6] - March 15, 2026

### Added
- **UI/UX Enhancements**
  - Modern design system with CSS variables
  - Enhanced file explorer with horizontal scrolling
  - Folder content indicators (empty vs. has children)
  - Custom scrollbars and improved typography
  - Floating mode indicator with icons
- **Platform Support**
  - Native Apple Silicon (arm64) support
  - Intel Mac (x64) support
  - Linux (x64) support
  - DMG installer for macOS
  - DEB package for Linux
- **Security**
  - DOMPurify integration for HTML sanitization
  - XSS prevention for pasted content
  - Path validation and sandboxed renderer
- **Performance**
  - Async HTML to Markdown conversion with Web Workers
  - Content hash-based caching strategy
  - LRU caching for rendered markdown

### Changed
- Updated development status to ~90% complete

---

## [0.0.5] - March 10, 2026

### Added
- **Search Features**
  - Local search within current document
  - Global search across all files in directory
  - Fast file scanning powered by fast-glob
  - Search result highlighting and context
- **Keyboard Shortcuts**
  - `Cmd/Ctrl + F` for local search
  - `Cmd/Ctrl + Shift + F` for global search
  - `F3` / `Cmd/Ctrl + G` for find next
  - `Shift + F3` / `Cmd/Ctrl + Shift + G` for find previous

---

## [0.0.4] - March 5, 2026

### Added
- **File Management**
  - File explorer with tree view
  - Folder navigation with expand/collapse
  - File operations (create, rename, delete)
  - Recent files tracking
- **Core Editing**
  - Dual-mode editing (Editor ↔ Preview)
  - Real-time markdown preview
  - Smart paste with HTML-to-Markdown conversion
  - State preservation (scroll, cursor position)
- **Markdown Extensions**
  - Emoji support via marked-emoji
  - Code preview via marked-code-preview
  - Base URL resolution via marked-base-url
- **Developer Experience**
  - TypeScript migration (100%)
  - Comprehensive test suite
  - CI/CD pipeline with GitHub Actions
  - ESLint and Prettier integration

### Changed
- Updated application icon

---

## [0.0.3] - February 28, 2026

### Added
- Basic markdown editor functionality
- File open/save operations
- Preview mode with marked.js
- Electron app structure

---

## [0.0.2] - February 20, 2026

### Added
- Initial Electron app setup
- Basic file loading
- Markdown rendering

---

## [0.0.1] - February 15, 2026

### Added
- Initial project setup
- TypeScript configuration
- Basic project structure

---

## Version History Summary

| Version | Date | Status |
|---------|------|--------|
| 0.0.8 | March 20, 2026 | Current |
| 0.0.7 | March 18, 2026 | Released |
| 0.0.6 | March 15, 2026 | Released |
| 0.0.5 | March 10, 2026 | Released |
| 0.0.4 | March 5, 2026 | Released |
| 0.0.3 | February 28, 2026 | Released |
| 0.0.2 | February 20, 2026 | Released |
| 0.0.1 | February 15, 2026 | Initial |

---

## Upcoming Features

### v0.1.0 (Q2 2026) - Planned
- Table of contents generation
- Word count and reading time
- Export to PDF/HTML
- Print support
- Multiple tabs for multiple files

### v0.2.0 (Q3 2026) - Planned
- Markdown table editor
- Image drag-and-drop
- Image upload to cloud storage
- Link checker
- Spell checker integration

### Future Versions
- Real-time collaboration
- Plugin system
- Live HTML editing mode
- Advanced theme customization
