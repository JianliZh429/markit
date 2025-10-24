/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
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
};
