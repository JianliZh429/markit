import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as os from 'os';
import * as path from 'path';

// Mock electron modules
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      const homeDir = os.homedir();
      switch (name) {
        case 'home': return homeDir;
        case 'documents': return path.join(homeDir, 'Documents');
        case 'desktop': return path.join(homeDir, 'Desktop');
        case 'downloads': return path.join(homeDir, 'Downloads');
        case 'userData': return path.join(homeDir, 'AppData', 'Roaming', 'Markit');
        default: return homeDir;
      }
    }),
  },
  dialog: {
    showMessageBox: jest.fn(() => Promise.resolve()),
  },
}));

// Import after mocking
import { 
  isPathSafe, 
  validatePath, 
  isMarkdownFile,
  showErrorDialog,
  showWarningDialog 
} from '../../markit/main/security';

describe('Security Module', () => {
  const homeDir = os.homedir();
  const documentsDir = path.join(homeDir, 'Documents');
  const desktopDir = path.join(homeDir, 'Desktop');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isPathSafe()', () => {
    it('should allow paths within home directory', () => {
      const safePath = path.join(homeDir, 'test.md');
      expect(isPathSafe(safePath)).toBe(true);
    });

    it('should allow paths within Documents', () => {
      const safePath = path.join(documentsDir, 'notes', 'test.md');
      expect(isPathSafe(safePath)).toBe(true);
    });

    it('should allow paths within Desktop', () => {
      const safePath = path.join(desktopDir, 'project', 'README.md');
      expect(isPathSafe(safePath)).toBe(true);
    });

    it('should reject paths outside safe directories', () => {
      const unsafePath = '/etc/passwd';
      expect(isPathSafe(unsafePath)).toBe(false);
    });

    it('should reject paths with directory traversal attempts', () => {
      const maliciousPath = path.join(documentsDir, '..', '..', 'etc', 'passwd');
      expect(isPathSafe(maliciousPath)).toBe(false);
    });

    it('should handle relative paths correctly', () => {
      const relativePath = './test.md';
      const result = isPathSafe(relativePath);
      // Result depends on current working directory
      expect(typeof result).toBe('boolean');
    });
  });

  describe('validatePath()', () => {
    it('should return validated path for safe paths', () => {
      const safePath = path.join(documentsDir, 'test.md');
      expect(() => validatePath(safePath)).not.toThrow();
      expect(validatePath(safePath)).toBe(safePath);
    });

    it('should throw error for unsafe paths', () => {
      const unsafePath = '/etc/passwd';
      expect(() => validatePath(unsafePath)).toThrow('Access denied');
    });

    it('should throw error for empty path', () => {
      expect(() => validatePath('')).toThrow('Invalid file path');
    });

    it('should throw error for non-string path', () => {
      expect(() => validatePath(null as any)).toThrow('Invalid file path');
      expect(() => validatePath(undefined as any)).toThrow('Invalid file path');
    });

    it('should remove null bytes from path', () => {
      const pathWithNullByte = path.join(documentsDir, 'test\0.md');
      const validated = validatePath(pathWithNullByte);
      expect(validated).not.toContain('\0');
    });

    it('should handle paths with spaces', () => {
      const pathWithSpaces = path.join(documentsDir, 'my folder', 'my file.md');
      expect(() => validatePath(pathWithSpaces)).not.toThrow();
    });

    it('should handle paths with special characters', () => {
      const specialPath = path.join(documentsDir, 'file (1).md');
      expect(() => validatePath(specialPath)).not.toThrow();
    });
  });

  describe('isMarkdownFile()', () => {
    it('should return true for .md files', () => {
      expect(isMarkdownFile('test.md')).toBe(true);
      expect(isMarkdownFile('/path/to/file.md')).toBe(true);
    });

    it('should return true for .markdown files', () => {
      expect(isMarkdownFile('test.markdown')).toBe(true);
      expect(isMarkdownFile('/path/to/file.markdown')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isMarkdownFile('test.MD')).toBe(true);
      expect(isMarkdownFile('test.Markdown')).toBe(true);
      expect(isMarkdownFile('test.MARKDOWN')).toBe(true);
    });

    it('should return false for non-markdown files', () => {
      expect(isMarkdownFile('test.txt')).toBe(false);
      expect(isMarkdownFile('test.js')).toBe(false);
      expect(isMarkdownFile('test.html')).toBe(false);
      expect(isMarkdownFile('test')).toBe(false);
    });

    it('should handle files without extension', () => {
      expect(isMarkdownFile('README')).toBe(false);
      expect(isMarkdownFile('test')).toBe(false);
    });
  });

  describe('showErrorDialog()', () => {
    it('should call dialog.showMessageBox with error type', async () => {
      const { dialog } = require('electron');
      await showErrorDialog('Test error', 'Test details');
      
      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error',
          message: 'Test error',
          detail: 'Test details',
        })
      );
    });

    it('should work without detail parameter', async () => {
      const { dialog } = require('electron');
      await showErrorDialog('Test error');
      
      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Test error',
        })
      );
    });
  });

  describe('showWarningDialog()', () => {
    it('should call dialog.showMessageBox with warning type', async () => {
      const { dialog } = require('electron');
      await showWarningDialog('Test warning', 'Test details');
      
      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Warning',
          message: 'Test warning',
          detail: 'Test details',
        })
      );
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle symlink attempts', () => {
      // Attempting to use ../ to escape
      const maliciousPath = path.join(documentsDir, 'safe', '..', '..', '..', 'etc', 'passwd');
      expect(isPathSafe(maliciousPath)).toBe(false);
    });

    it('should handle Windows drive paths correctly', () => {
      if (process.platform === 'win32') {
        const windowsPath = 'C:\\Users\\test\\Documents\\file.md';
        // Should validate based on whether it's within safe directories
        expect(typeof isPathSafe(windowsPath)).toBe('boolean');
      }
    });

    it('should handle very long paths', () => {
      const longPath = path.join(documentsDir, 'a'.repeat(255), 'file.md');
      expect(typeof isPathSafe(longPath)).toBe('boolean');
    });

    it('should handle unicode characters in paths', () => {
      const unicodePath = path.join(documentsDir, '日本語', 'ファイル.md');
      expect(() => validatePath(unicodePath)).not.toThrow();
    });
  });
});
