# Contributing to Markit

Thank you for your interest in contributing to Markit! This guide will help you get started with development.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Getting Started

### Prerequisites

- Node.js 18.x or 20.x
- npm 9.x or higher
- Git
- Visual Studio Code (recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/markit.git
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

## Development Setup

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- TypeScript and JavaScript Language Features

### Environment

The project uses TypeScript for both the main and renderer processes. TypeScript files are compiled to JavaScript in the `dist/` directory.

## Project Structure

```
markit/
├── markit/               # Source code
│   ├── main/            # Main process (Node.js/Electron)
│   │   ├── app.ts       # Application entry point
│   │   ├── menu.ts      # Application menu
│   │   ├── preload.ts   # Preload script (security bridge)
│   │   ├── security.ts  # Path validation and security
│   │   ├── recent-files.ts  # Recent files management
│   │   ├── shortcuts.ts # Keyboard shortcuts
│   │   ├── config.ts    # Configuration system
│   │   └── utils/       # Utility modules
│   │       └── logger.ts # Logging framework
│   └── renderer/        # Renderer process (Browser)
│       ├── renderer.js  # Main renderer (needs TS migration)
│       ├── menu.js      # Renderer menu
│       ├── search.ts    # Search functionality
│       ├── state.ts     # State management
│       ├── services/    # Service layer
│       │   ├── fileService.ts
│       │   └── markdownService.ts
│       └── utils/       # Utility modules
│           └── performance.ts
├── tests/               # Test suites
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── types/              # TypeScript type definitions
│   ├── index.d.ts
│   └── preload.d.ts
└── dist/               # Compiled JavaScript (git-ignored)
```

## Development Workflow

### Building

```bash
# Development build with source maps
npm run build

# Production build
npm run build:prod
```

### Running

```bash
# Start the application
npm start

# Start with development tools open
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Code Standards

### TypeScript

- Use strict TypeScript settings (enabled in tsconfig.json)
- Avoid `any` types - use proper type definitions
- Add explicit return type annotations to functions
- Use interfaces for object shapes

### Naming Conventions

- **Files**: kebab-case (e.g., `recent-files.ts`)
- **Classes**: PascalCase (e.g., `FileService`)
- **Functions**: camelCase (e.g., `loadFile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RECENT_FILES`)
- **Interfaces**: PascalCase with descriptive names (e.g., `SearchResult`)

### Code Organization

- Keep files focused and under 300 lines when possible
- Use modules to separate concerns
- Place shared utilities in `utils/` directories
- Use service layer for business logic
- Keep UI code separate from business logic

### Error Handling

- Use the centralized error handling utility
- Always handle promise rejections
- Provide user-friendly error messages
- Log errors with appropriate log levels

### Logging

Use the centralized logging framework instead of console.log:

```typescript
import { logger, fileLogger } from './utils/logger';

logger.info('CATEGORY', 'Message');
fileLogger.error('Error message', error);
```

### Comments

- Write self-documenting code when possible
- Add JSDoc comments for public APIs
- Explain "why" rather than "what" in comments
- Keep comments up-to-date with code changes

## Testing

### Writing Tests

- Place unit tests in `tests/unit/`
- Place integration tests in `tests/integration/`
- Name test files with `.test.ts` suffix
- Use descriptive test names

### Test Structure

```typescript
describe('Module Name', () => {
  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Coverage Goals

- Aim for 70%+ code coverage for utility modules
- Focus on testing business logic
- Don't test trivial getters/setters
- Test error cases and edge cases

## Submitting Changes

### Before Submitting

1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Build successfully: `npm run build`
4. Test manually in the application
5. Update documentation if needed

### Commit Messages

Follow the Conventional Commits specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(search): add caching for search results

fix(security): validate file paths properly

docs(readme): update installation instructions
```

### Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with clear commits
3. Push to your fork: `git push origin feature/your-feature`
4. Create a Pull Request on GitHub
5. Address review feedback
6. Wait for CI checks to pass
7. Squash and merge when approved

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Proper error handling
```

## Getting Help

- Check existing issues on GitHub
- Review the DEVELOPMENT_PLAN.md for roadmap
- Read the architecture documentation
- Ask questions in pull request discussions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
