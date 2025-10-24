
# Markit

![Build Status](https://github.com/JianliZh429/markit/actions/workflows/build.yml/badge.svg?branch=main)

A modern, cross-platform Markdown editor built with Electron and TypeScript. Markit provides a clean, distraction-free writing experience with powerful features for managing and editing Markdown files.

## Features

- **Dual-pane editing**: Side-by-side editor and preview with real-time rendering
- **File management**: Built-in file explorer with folder navigation
- **Search capabilities**: Local content search and global file search
- **Recent files**: Quick access to recently opened files
- **Keyboard shortcuts**: Comprehensive shortcuts for efficient workflow
- **Autosave**: Automatic saving with configurable intervals
- **Security**: Path validation and sandboxed renderer process
- **Cross-platform**: Works on macOS, Windows, and Linux

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

### Packaging
- `npm run package` - Create platform-specific packages
- `npm run dmg` - Create macOS DMG installer
- `npm run deb` - Create Debian package
- `npm run installer` - Build all installers

## Architecture

Markit follows Electron's multi-process architecture:

- **Main Process**: Node.js environment handling system APIs, file operations, and application lifecycle
- **Renderer Process**: Chromium browser environment for the UI, sandboxed for security
- **Preload Script**: Security bridge between main and renderer processes

### Key Components

- **State Management**: Centralized state with event-driven updates
- **Service Layer**: Abstracted file and markdown operations
- **Module System**: Separated concerns for editor, preview, and file tree
- **Security**: Path validation and IPC channel whitelisting
- **Performance**: LRU caching for search results and markdown rendering

## Project Structure

```
markit/
├── markit/               # Source code
│   ├── main/            # Main process (Node.js)
│   │   ├── app.ts       # Application entry point
│   │   ├── menu.ts      # Application menu
│   │   ├── preload.ts   # Security bridge
│   │   └── utils/       # Utilities and logging
│   └── renderer/        # Renderer process (Browser)
│       ├── renderer.ts  # Main renderer entry
│       ├── services/    # Business logic services
│       ├── modules/     # UI modules (editor, preview, etc.)
│       └── utils/       # Performance utilities
├── tests/               # Test suites
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
└── types/              # TypeScript definitions
```

## Development Status

Markit is actively developed with ~70% completion of the planned features:

- ✅ **Security & Architecture**: Complete
- ✅ **TypeScript Migration**: 85% complete (main process fully migrated)
- ✅ **Testing Infrastructure**: 90% complete
- ✅ **Core Features**: 95% complete
- 🚧 **Renderer Refactoring**: In progress
- 🚧 **Performance Optimization**: Partial

See [DEVELOPMENT_PLAN_2025.md](DEVELOPMENT_PLAN_2025.md) for detailed roadmap.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Development setup
- Code standards
- Testing requirements
- Pull request process

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed system architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- [DEVELOPMENT_PLAN_2025.md](DEVELOPMENT_PLAN_2025.md) - Project roadmap

## Keyboard Shortcuts

- `Cmd/Ctrl + N` - New file
- `Cmd/Ctrl + O` - Open file
- `Cmd/Ctrl + S` - Save file
- `Cmd/Ctrl + Shift + O` - Open folder
- `Cmd/Ctrl + E` - Toggle edit/preview mode
- `Cmd/Ctrl + B` - Toggle file explorer
- `Cmd/Ctrl + F` - Local search
- `Cmd/Ctrl + Shift + F` - Global search

## Technology Stack

- **Electron** 38.2.2 - Cross-platform desktop framework
- **TypeScript** 5.9.3 - Type-safe JavaScript
- **marked** 16.4.0 - Markdown parser with plugins
- **Jest** 30.2.0 - Testing framework
- **ESLint** & **Prettier** - Code quality tools
- **esbuild** - Fast bundler for renderer process

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Jianli Zhang

---

**Version**: 0.0.2  
**Status**: Active Development
