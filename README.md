
# Markit

![Build Status](https://github.com/JianliZh429/markit/actions/workflows/test.yml/badge.svg?branch=main)

A modern, cross-platform Markdown editor built with Electron and TypeScript. Markit provides a clean, distraction-free writing experience with powerful features for managing and editing Markdown files.

## Features

### Core Editing
- **Dual-mode editing**: Switch between raw markdown editor and live preview
- **Real-time preview**: Instant markdown rendering with syntax highlighting
- **Smart paste**: Automatic HTML-to-Markdown conversion when pasting
- **State preservation**: Maintains scroll position and cursor location across mode switches
- **Mode indicator**: Floating badge showing current edit/preview mode

### File Management
- **File explorer**: Built-in tree view with folder navigation
- **Recent files**: Quick access to recently opened files and folders
- **File operations**: Create, rename, delete files and directories
- **Folder indicators**: Visual distinction between empty and populated folders
- **Horizontal scrolling**: View complete long filenames
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
- **Performance optimization**: LRU caching, content hash-based caching, and Web Workers
- **Security**: DOMPurify sanitization, path validation, sandboxed renderer, and IPC channel whitelisting

### UI/UX
- **Modern design system**: CSS variables for consistent theming
- **Custom scrollbars**: Styled scrollbars for better aesthetics
- **Improved typography**: System fonts for native feel
- **Enhanced file explorer**: Better spacing, hover effects, and visual feedback

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
- `npm run package` - Create platform-specific packages (macOS Intel, macOS Apple Silicon, Linux)
- `npm run package:mac` - Build for macOS (both Intel and Apple Silicon)
- `npm run package:mac-intel` - Build for Intel Macs (x64)
- `npm run package:mac-apple` - Build for Apple Silicon (arm64)
- `npm run package:linux` - Build for Linux (x64)
- `npm run dmg` - Create macOS DMG installers (Intel + Apple Silicon)
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

Markit is actively developed with ~85% completion. For detailed information about completed features, in-progress work, and future plans, see the [Development Plan](docs/DEVELOPMENT_PLAN.md).

### CI/CD Pipeline
- **Multi-platform testing**: Ubuntu and macOS with Node.js 18.x and 20.x
- **Automated builds**: TypeScript compilation and packaging verification
- **Code quality**: ESLint, Prettier, and test coverage reporting
- **Security audits**: Dependency vulnerability scanning
- **Package verification**: Cross-platform installer testing (Intel + Apple Silicon)

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical architecture and system design.
See [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for the complete development roadmap and feature status.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Development setup
- Code standards
- Testing requirements
- Pull request process

## Documentation

### For Users
- [**User Manual**](docs/USER_MANUAL.md) - Complete guide to using Markit
- [**Changelog**](CHANGELOG.md) - Version history and release notes
- [**Keyboard Shortcuts**](#keyboard-shortcuts) - Quick reference for all shortcuts

### For Developers
- [**API Documentation**](docs/API.md) - Technical API reference
- [**Architecture**](docs/ARCHITECTURE.md) - System architecture and design patterns
- [**Contributing Guide**](docs/CONTRIBUTING.md) - Development guidelines
- [**Development Plan**](docs/DEVELOPMENT_PLAN.md) - Roadmap and feature status

## Security Considerations

Markit implements multiple layers of security to protect users from malicious content:

### Content Sanitization
- **DOMPurify Integration**: All HTML pasted into the editor is sanitized using [DOMPurify](https://github.com/cure53/DOMPurify) before conversion to Markdown
- **XSS Prevention**: Script tags, event handlers, and dangerous protocols are automatically stripped
- **Safe HTML Subset**: Only safe HTML elements and attributes are allowed during HTML-to-Markdown conversion

### Electron Security
- **Sandboxed Renderer**: The renderer process runs in a sandboxed environment with limited system access
- **Context Isolation**: Preload script provides a secure bridge between renderer and main processes
- **IPC Channel Whitelisting**: Only explicitly allowed IPC channels can be invoked from the renderer
- **Path Validation**: All file system operations validate paths to prevent directory traversal attacks

### Best Practices for Users
1. **Keep Dependencies Updated**: Regularly run `npm audit` and update dependencies
2. **Verify Pasted Content**: While HTML is sanitized, always review pasted content from untrusted sources
3. **Use Official Builds**: Download Markit only from official releases or build from source
4. **Report Security Issues**: Please report security vulnerabilities responsibly via GitHub Issues

### Security Audit
- Run `npm audit` to check for known vulnerabilities in dependencies
- CI pipeline includes automated security auditing on every push
- Dependency tree verification is performed in CI/CD

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
- `F3` or `Cmd/Ctrl + G` - Find next match
- `Shift + F3` or `Cmd/Ctrl + Shift + G` - Find previous match

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

### Security
- **DOMPurify** 3.3.3 - HTML sanitization for XSS prevention

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

**Version**: 0.0.8
**Status**: Active Development (~92% Complete)
**Platforms**: macOS (Intel + Apple Silicon), Linux
