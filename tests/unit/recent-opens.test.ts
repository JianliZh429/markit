import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Create temp directory for tests
const testDir = path.join(os.tmpdir(), 'markit-recent-files-test');
const mockDataDir = path.join(testDir, 'user-data');

// Mock the electron app module
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      if (name === 'userData') return mockDataDir;
      return testDir;
    }),
  },
}));

// Import after mocking
import * as recentOpens from '../../markit/main/recent-opens';

describe('Recent Opens Module', () => {
  const mockFilePath = path.join(mockDataDir, 'recent-opens.json');
  
  beforeEach(() => {
    // Clear any existing mocks
    jest.clearAllMocks();

    // Ensure test directories exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(mockDataDir)) {
      fs.mkdirSync(mockDataDir, { recursive: true });
    }
    
    // Clean up any existing recent-files.json from previous tests
    if (fs.existsSync(mockFilePath)) {
      fs.unlinkSync(mockFilePath);
    }
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(mockFilePath)) {
      fs.unlinkSync(mockFilePath);
    }
  });

  describe('load()', () => {
    it('should return empty array when file does not exist', () => {
      const result = recentOpens.load();
      expect(result).toEqual([]);
    });

    it('should return empty array when file contains invalid JSON', () => {
      // Create invalid JSON file
      const mockPath = path.join(process.cwd(), 'test-recent-opens.json');
      fs.writeFileSync(mockPath, 'invalid json');

      const result = recentOpens.load();
      expect(result).toEqual([]);

      // Cleanup
      if (fs.existsSync(mockPath)) {
        fs.unlinkSync(mockPath);
      }
    });
  });

  describe('add()', () => {
    it('should add a new file to the recent opens list', () => {
      const testFile = '/path/to/test.md';
      recentOpens.add(testFile);

      const result = recentOpens.load();
      expect(result).toContain(testFile);
    });

    it('should move existing file to the top of the list', () => {
      const file1 = '/path/to/file1.md';
      const file2 = '/path/to/file2.md';

      recentOpens.add(file1);
      recentOpens.add(file2);
      recentOpens.add(file1); // Add file1 again

      const result = recentOpens.load();
      expect(result[0]).toBe(file1); // file1 should be first
      expect(result[1]).toBe(file2);
    });

    it('should limit the list to 10 files', () => {
      // Add 15 files
      for (let i = 0; i < 15; i++) {
        recentOpens.add(`/path/to/file${i}.md`);
      }

      const result = recentOpens.load();
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should keep most recent 10 files when limit is exceeded', () => {
      // Add 12 files
      for (let i = 0; i < 12; i++) {
        recentOpens.add(`/path/to/file${i}.md`);
      }

      const result = recentOpens.load();
      expect(result.length).toBe(10);
      expect(result[0]).toBe('/path/to/file11.md'); // Most recent
      expect(result).not.toContain('/path/to/file0.md'); // Oldest should be removed
      expect(result).not.toContain('/path/to/file1.md');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file path gracefully', () => {
      expect(() => recentOpens.add('')).not.toThrow();
    });

    it('should handle special characters in file paths', () => {
      const specialPath = '/path/with spaces/and-dashes/file (1).md';
      recentOpens.add(specialPath);

      const result = recentOpens.load();
      expect(result).toContain(specialPath);
    });

    it('should maintain order after multiple operations', () => {
      const files = [
        '/path/to/file1.md',
        '/path/to/file2.md',
        '/path/to/file3.md',
      ];

      files.forEach(f => recentOpens.add(f));

      const result = recentOpens.load();
      expect(result[0]).toBe(files[2]); // Last added should be first
      expect(result[1]).toBe(files[1]);
      expect(result[2]).toBe(files[0]);
    });
  });

  describe('Async Methods', () => {
    it('should have async versions of add and load', () => {
      expect(typeof recentOpens.addAsync).toBe('function');
      expect(typeof recentOpens.loadAsync).toBe('function');
    });

    it('addAsync should work correctly', async () => {
      const testFile = '/path/to/async-test.md';
      await recentOpens.addAsync(testFile);

      const result = await recentOpens.loadAsync();
      expect(result).toContain(testFile);
    });

    it('loadAsync should return empty array when no files', async () => {
      const result = await recentOpens.loadAsync();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
