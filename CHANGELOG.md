# Changelog

All notable changes to Markit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for v0.4.0
- Image upload to cloud storage
- Link checker
- Spell checker integration

---

## [0.3.0] - March 21, 2026

### ✨ Added

#### Image Drag-and-Drop (NEW)
- **Drag images from Finder/Explorer** directly into the editor
- **Automatic .assets folder creation** - Images saved to `.assets/` subfolder relative to each file
- **Smart path resolution** - Each file uses its own `.assets/` folder for organization
- **Hidden folders** - `.assets` folders are hidden by default (dotfile convention)
- **Undo/Redo support** - Image insertion can be undone/redone
- **File format support** - PNG, JPEG, GIF, WebP

#### How It Works
- File in root (`README.md`) → Images saved to `project/.assets/`
- File in subfolder (`chapter1.md`) → Images saved to `chapter1/.assets/`
- Markdown reference: `![image.png](.assets/image.png)`

#### How to Use
1. Open a markdown file
2. Drag an image from Finder/Explorer into the editor
3. Image is saved to `.assets/` folder in the same directory
4. Markdown reference inserted at cursor position
5. Switch to preview (`Cmd+/`) to see the image

#### Export to HTML (NEW)
- **Export Menu Item** - File → Export to HTML... or `Cmd/Ctrl+E`
- **Styled HTML Output** - Professional GitHub-style formatting
- **CJK Font Support** - Full support for Chinese, Japanese, Korean characters
- **Print-Ready** - A4 page size with proper margins for PDF export
- **Smart Filename** - Uses opened file's name as default
- **Fallback Download** - Downloads as blob if file dialog fails

#### How to Export to PDF
1. Export markdown to HTML (`Cmd/Ctrl+E`)
2. Open HTML file in any browser
3. Use browser's Print dialog (`Cmd/Ctrl+P`)
4. Select "Save as PDF" as destination

### 🔧 Changed

- **Print Support** - Removed native print feature; users can print HTML to PDF via browser

---

## [0.2.0] - March 21, 2026

### ✨ Added

#### Markdown Table Editor (NEW)
- **Insert Table Dialog** - Visual table creation with configurable rows, columns, and header text
- **Menu Item** - Edit → Insert Table...
- **Keyboard Shortcut** - `Cmd/Ctrl + Alt + T`
- **Undo/Redo Support** - Full integration with browser undo/redo (`Cmd+Z` / `Cmd+Y`)
- **Auto-generated Content** - Tables include placeholder text (Cell row-col format)
- **Table Size Limits** - Up to 20 rows and 10 columns

#### How to Insert a Table
1. Press `Cmd/Ctrl + Alt + T` or go to Edit → Insert Table...
2. Configure table size (rows, columns, header text)
3. Click "Insert Table" → Markdown table inserted at cursor

#### Example Output
```markdown
| Header 1 | Header 2 | Header 3 |
| --- | --- | --- |
| Cell 1-1 | Cell 1-2 | Cell 1-3 |
| Cell 2-1 | Cell 2-2 | Cell 2-3 |
```

---

## [0.2.0] - March 21, 2026

### ✨ Added

#### Export to HTML (NEW)
- **Export Menu Item** - File → Export to HTML... or `Cmd/Ctrl+E`
- **Styled HTML Output** - Professional GitHub-style formatting
- **CJK Font Support** - Full support for Chinese, Japanese, Korean characters
- **Print-Ready** - A4 page size with proper margins for PDF export
- **Smart Filename** - Uses opened file's name as default
- **Fallback Download** - Downloads as blob if file dialog fails

#### How to Export to PDF
1. Export markdown to HTML (`Cmd/Ctrl+E`)
2. Open HTML file in any browser
3. Use browser's Print dialog (`Cmd/Ctrl+P`)
4. Select "Save as PDF" as destination

### 🔧 Changed

- **Print Support** - Removed native print feature; users can print HTML to PDF via browser

---

## [0.1.0] - March 21, 2026

### 🎉 Major Release - Table of Contents & Unicode Support

This release consolidates all v0.0.x features and adds significant new functionality.

### ✨ Added

#### Table of Contents (NEW)
- **TOC Panel** - Generate table of contents from markdown headings (# to ######)
- **Auto-Explorer Toggle** - Explorer panel auto-hides when TOC opens, shows when TOC closes
- **Click-to-Scroll** - Click TOC headings to scroll to section in both edit and preview modes
- **Unicode Support** - Full support for CJK (Chinese, Japanese, Korean) and other non-Latin scripts
- **Keyboard Shortcut** - `Cmd/Ctrl + Shift + T` to toggle TOC panel
- **TOC Close Button** - X button in TOC header closes panel and restores Explorer
- **Auto-Update** - TOC updates automatically as you type (when panel is visible)
- **Heading ID Generation** - marked renderer generates anchor IDs for all headings

#### Previous Features (Consolidated from v0.0.1-v0.0.8)
- Dual-mode editing (Editor ↔ Preview) with real-time preview
- Smart paste with HTML-to-Markdown conversion (DOMPurify sanitized)
- File explorer with tree view and folder navigation
- Recent Files Switcher modal (Cmd/Ctrl + Tab)
- Recent Opens menu (persistent project-level)
- Local and global search with highlighting
- Settings modal (theme, font, autosave customization)
- Keyboard shortcuts modal (Cmd/Ctrl + ?)
- Markdown extensions (emoji, code preview, base URL)
- Multi-platform support (macOS Intel/Apple Silicon, Linux)
- Security features (path validation, sandboxed renderer, IPC whitelisting)
- Performance optimizations (Web Workers, LRU caching, content hash caching)

### 🔧 Changed

- **Version Consolidation** - All v0.0.x features merged into v0.1.0
- **Slugify Function** - Unicode-safe slugify using `\p{L}\p{N}` property escapes
- **TOC Module** - Fixed panel class toggling (now toggles outer panel, not inner container)
- **Scroll Behavior** - Smooth scroll with `scrollIntoView` in preview mode
- **CSS Escape** - Use `CSS.escape()` for safe querySelector with special characters

### 🐛 Fixed

- TOC panel not showing (fixed class toggling on correct element)
- TOC headings not generating for non-ASCII characters (Chinese, Japanese, Korean)
- Preview mode scrolling not working (added heading ID generation in marked renderer)
- `querySelector` error with empty IDs (added empty ID checks and CSS.escape)
- Explorer panel not restoring after TOC close (both X button and shortcut now restore)

### 📦 Technical

- Added `scrollToLine()` method to EditorModule
- Updated marked renderer with custom heading function
- Added `toggleToc()` and `updateToc()` helper functions
- Added `scrollToSection()` for cross-mode navigation
- TOC module now receives both panel and container elements

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

| Version | Date | Status | Key Features |
|---------|------|--------|--------------|
| 0.1.0 | March 21, 2026 | **Current** | TOC, Unicode support, consolidated release |
| 0.0.8 | March 20, 2026 | Released | Settings, documentation, enhanced file tree |
| 0.0.7 | March 18, 2026 | Released | Recent Files Switcher, Recent Opens menu |
| 0.0.6 | March 15, 2026 | Released | Multi-platform, security, performance |
| 0.0.5 | March 10, 2026 | Released | Local & global search |
| 0.0.4 | March 5, 2026 | Released | File management, markdown extensions |
| 0.0.3 | February 28, 2026 | Released | Basic editor functionality |
| 0.0.2 | February 20, 2026 | Released | Initial Electron app |
| 0.0.1 | February 15, 2026 | Initial | Project setup |

---

## Upcoming Features

### v0.2.0 (Q3 2026) - Planned
- Word count and reading time
- Export to PDF/HTML
- Print support
- Multiple tabs for multiple files

### v0.3.0 (Q4 2026) - Planned
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
