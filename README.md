
# Markit

![Build Status](https://github.com/JianliZh429/markit/actions/workflows/test.yml/badge.svg?branch=main)

A modern, cross-platform Markdown editor built with Electron and TypeScript. Markit provides a clean, distraction-free writing experience with powerful features for managing and editing Markdown files.

## Features

### Core Editing
- **Dual-mode editing**: Switch between raw markdown editor and live preview
- **Real-time preview**: Instant markdown rendering with syntax highlighting
- **Smart paste**: Automatic HTML-to-Markdown conversion when pasting
- **State preservation**: Maintains scroll position and cursor location across mode switches

### File Management
- **File explorer**: Built-in tree view with folder navigation
- **Recent files**: Quick access to recently opened files and folders
- **File operations**: Create, rename, delete files and directories
- **Multi-format support**: Optimized for Markdown (.md) files

### Search & Navigation
- **Local search**: Search within current document with highlighting
- **Global search**: Search across all files in the current directory
- **Fast file scanning**: Powered by fast-glob for efficient directory traversal
- **Context-aware results**: Shows search matches with surrounding context

### Advanced Features
- **Markdown extensions**: Support for emoji, code preview, and base URL handling
- **Keyboard shortcuts**: Comprehensive shortcuts for efficient workflow
- **Autosave**: Automatic saving with configurable intervals
- **Performance optimization**: LRU caching for search results and markdown rendering
- **Security**: Path validation, sandboxed renderer, and IPC channel whitelisting

## Installation

### Prerequisites

- Node.js 18.x or 20.x
- npm 9.x or higher

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/JianliZh429/markit.git
cd markit
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the application:
```bash
npm start
```

## Available Scripts

### Development
- `npm start` - Start the application in development mode
- `npm run build` - Build for development with source maps
- `npm run build:dev` - Development build with debugging enabled
- `npm run build:prod` - Production build (optimized)

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

### Packaging & Distribution
- `npm run clean` - Clean build and dist directories
- `npm run package` - Create platform-specific packages (macOS, Linux)
- `npm run dmg` - Create macOS DMG installer with app icon
- `npm run deb` - Create Debian package for Linux distribution
- `npm run installer` - Build complete installer suite for all platforms

## Architecture

Markit follows Electron's multi-process architecture:

- **Main Process**: Node.js environment handling system APIs, file operations, and application lifecycle
- **Renderer Process**: Chromium browser environment for the UI, sandboxed for security
- **Preload Script**: Security bridge between main and renderer processes

### Key Components

- **State Management**: Centralized state with event-driven updates and persistence
- **Service Layer**: Abstracted file operations and markdown processing
- **Module System**: Separated concerns for editor, preview, file tree, and search
- **Security Layer**: Path validation, IPC channel whitelisting, and content sanitization
- **Performance Layer**: LRU caching, debouncing, and optimized file scanning
- **Configuration System**: Persistent user preferences and application settings

## Project Structure

```
markit/
├── markit/                    # Source code
│   ├── main/                 # Main process (Node.js environment)
│   │   ├── app.ts           # Application lifecycle and IPC handlers
│   │   ├── menu.ts          # Application menu and context menus
│   │   ├── preload.ts       # Security bridge between processes
│   │   ├── security.ts      # Path validation and security utilities
│   │   ├── recent-files.ts  # Recent files management
│   │   ├── shortcuts.ts     # Global keyboard shortcuts
│   │   ├── config.ts        # Configuration management
│   │   └── utils/           # Logging and utility functions
│   ├── renderer/            # Renderer process (Browser environment)
│   │   ├── renderer.ts      # Main renderer orchestrator
│   │   ├── state.ts         # Centralized state management
│   │   ├── search.ts        # Search functionality
│   │   ├── services/        # Business logic services
│   │   │   ├── fileService.ts      # File system operations
│   │   │   └── markdownService.ts  # Markdown parsing and rendering
│   │   ├── modules/         # UI component modules
│   │   │   ├── editor.ts    # Markdown editor functionality
│   │   │   ├── preview.ts   # Preview pane with live rendering
│   │   │   └── fileTree.ts  # File explorer tree view
│   │   └── utils/           # Performance utilities (caching, debouncing)
│   ├── assets/              # Static resources
│   │   ├── styles.css       # Application styling
│   │   └── images/          # Icons and application assets
│   └── index.html           # Main application HTML
├── tests/                   # Test suites
│   ├── unit/               # Unit tests for individual modules
│   └── integration/        # Integration tests for IPC and workflows
├── types/                  # TypeScript type definitions
├── .github/                # GitHub Actions CI/CD workflows
└── dist/                   # Compiled output (generated)
```

## Development Status

Markit is actively developed with ~70% completion of the planned features:

- ✅ **Security & Architecture**: Complete with path validation and sandboxed renderer
- ✅ **TypeScript Migration**: 85% complete (main process fully migrated, renderer in progress)
- ✅ **Testing Infrastructure**: 90% complete with Jest, unit tests, and CI/CD pipeline
- ✅ **Core Features**: 95% complete with dual-mode editing, search, and file management
- ✅ **Performance Optimization**: LRU caching, debouncing, and efficient file scanning
- 🚧 **Renderer Refactoring**: Modular architecture with editor, preview, and file tree modules
- 🚧 **Advanced Features**: Web workers and virtual scrolling planned

### CI/CD Pipeline
- **Multi-platform testing**: Ubuntu and macOS with Node.js 18.x and 20.x
- **Automated builds**: TypeScript compilation and packaging verification
- **Code quality**: ESLint, Prettier, and test coverage reporting
- **Security audits**: Dependency vulnerability scanning
- **Package verification**: Cross-platform installer testing

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical architecture and system design.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Development setup
- Code standards
- Testing requirements
- Pull request process

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed system architecture and design patterns
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines and contribution process

## Keyboard Shortcuts

### File Operations
- `Cmd/Ctrl + N` - Create new file
- `Cmd/Ctrl + O` - Open file dialog
- `Cmd/Ctrl + Shift + O` - Open folder dialog
- `Cmd/Ctrl + S` - Save current file
- `Cmd/Ctrl + A` - Select all content

### View & Navigation
- `Cmd/Ctrl + E` - Toggle between edit and preview mode
- `Cmd/Ctrl + B` - Toggle file explorer panel
- `Cmd/Ctrl + F` - Local search within current document
- `Cmd/Ctrl + Shift + F` - Global search across all files

### Editor Features
- Smart paste with HTML-to-Markdown conversion
- Auto-save with configurable intervals
- Context menu with file operations
- Scroll synchronization between editor and preview

## Technology Stack

### Core Framework
- **Electron** 38.2.2 - Cross-platform desktop framework
- **TypeScript** 5.9.3 - Type-safe JavaScript development
- **Node.js** - Backend runtime for main process

### Markdown Processing
- **marked** 16.4.0 - Fast markdown parser and compiler
- **marked-emoji** 2.0.1 - Emoji support in markdown
- **marked-highlight** 2.2.2 - Syntax highlighting for code blocks
- **marked-code-preview** 1.3.7 - Enhanced code block rendering
- **marked-base-url** 1.1.7 - Base URL resolution for relative links

### Development Tools
- **Jest** 30.2.0 - Testing framework with TypeScript support
- **ESLint** 9.37.0 - Code linting and style enforcement
- **Prettier** 3.6.2 - Code formatting
- **esbuild** 0.25.10 - Fast bundler for renderer process
- **ts-jest** 29.4.4 - TypeScript support for Jest

### File Operations
- **fast-glob** 3.3.3 - High-performance file system scanning
- **fs-extra** 11.3.2 - Enhanced file system operations

### Build & Packaging
- **@electron/packager** 18.4.4 - Application packaging
- **electron-installer-dmg** 5.0.1 - macOS installer creation
- **electron-installer-debian** 3.2.0 - Linux package creation

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Jianli Zhang

---

**Version**: 0.0.2  
**Status**: Active Development
