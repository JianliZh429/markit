/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        types: ['jest', 'node'],
      },
    }],
  },
  collectCoverageFrom: [
    'markit/main/**/*.ts',
    'markit/renderer/**/*.ts',
    '!markit/renderer/renderer.js',
    '!markit/renderer/menu.js',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/markit/$1',
    '^../renderer/search.js$': '<rootDir>/markit/renderer/search.ts',
  },
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  // Use jsdom for renderer tests
  projects: [
    {
      displayName: 'main',
      testEnvironment: 'node',
      testMatch: ['**/tests/unit/**/*.test.ts', '**/tests/integration/**/*.test.ts'],
      preset: 'ts-jest',
    },
    {
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      testMatch: ['**/tests/renderer/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: {
            types: ['jest', 'jsdom'],
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/markit/$1',
        '^../renderer/search.js$': '<rootDir>/markit/renderer/search.ts',
        '^../state.js$': '<rootDir>/markit/renderer/state.ts',
        '^../services/markdownService.js$': '<rootDir>/markit/renderer/services/markdownService.ts',
        '^../utils/performance.js$': '<rootDir>/markit/renderer/utils/performance.ts',
      },
    },
  ],
};;
