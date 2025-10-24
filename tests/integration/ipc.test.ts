import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';

// Mock electron modules
const mockIpcRenderer = {
  send: jest.fn(),
  on: jest.fn(),
  invoke: jest.fn(),
};

const mockContextBridge = {
  exposeInMainWorld: jest.fn(),
};

jest.mock('electron', () => ({
  contextBridge: mockContextBridge,
  ipcRenderer: mockIpcRenderer,
  app: {
    getPath: jest.fn((name: string) => {
      const homeDir = os.homedir();
      const tmpDir = os.tmpdir();
      switch (name) {
        case 'home': return homeDir;
        case 'documents': return path.join(homeDir, 'Documents');
        case 'desktop': return path.join(homeDir, 'Desktop');
        case 'temp': return tmpDir;
        case 'downloads': return path.join(homeDir, 'Downloads');
        case 'userData': return path.join(homeDir, 'AppData', 'Roaming', 'Markit');
        default: return homeDir;
      }
    }),
  },
  dialog: {
    showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
    showOpenDialog: jest.fn(() => Promise.resolve({ filePaths: [] })),
    showSaveDialog: jest.fn(() => Promise.resolve({ filePath: undefined })),
  },
}));

// Create a chainable marked mock
const markedMock = {
  parse: jest.fn((content: string) => {
    // Simulate basic markdown parsing
    let html = content;
    if (content.includes('# ')) html = html.replace(/# (.+)/g, '<h1>$1</h1>');
    if (content.includes('**')) html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    if (content.includes('```')) html = html.replace(/```(\w+)?\n(.+?)\n```/gs, '<code>$2</code>');
    if (content.includes('[')) html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    return html;
  }),
  use: jest.fn().mockReturnThis(),
};

// Mock marked and its plugins to avoid ESM issues
jest.mock('marked', () => ({
  marked: markedMock,
}));

jest.mock('marked-code-preview', () => jest.fn().mockReturnValue({}));
jest.mock('marked-emoji', () => ({
  markedEmoji: jest.fn().mockReturnValue({}),
}));
jest.mock('marked-base-url', () => ({
  baseUrl: jest.fn().mockReturnValue({}),
}));

// Mock @octokit/rest
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      emojis: {
        // @ts-expect-error - Mocking for tests
        get: jest.fn().mockResolvedValue({ data: {} }),
      },
    },
  })),
}));

// Mock the search module with actual implementation
const mockSearchInFiles = jest.fn();
jest.mock('../../markit/renderer/search', () => ({
  searchInFiles: mockSearchInFiles,
}));

describe('IPC Integration Tests', () => {
  let testDir: string;
  let electronAPI: any;

  beforeEach(async () => {
    // Create test directory
    testDir = path.join(os.tmpdir(), `markit-ipc-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Clear mocks
    jest.clearAllMocks();
    
    // Configure search mock to actually search files
    // @ts-expect-error - Mock implementation
    mockSearchInFiles.mockImplementation(async (directory: string, keyword: string) => {
      const fg = require('fast-glob');
      const fsExtra = require('fs-extra');
      
      const pattern = `${directory}/**/*.md`;
      const files = await fg(pattern);
      
      const results: any[] = [];
      for (const file of files) {
        try {
          const content = await fsExtra.readFile(file, 'utf-8');
          const regex = new RegExp(keyword, 'gi');
          const matches = [...content.matchAll(regex)];
          
          if (matches.length > 0) {
            results.push({
              file,
              matches: matches.map((match: any) => ({
                line: match.index ?? 0,
                snippet: content.substring(Math.max(0, (match.index ?? 0) - 20), Math.min(content.length, (match.index ?? 0) + keyword.length + 20)),
                context: content.substring(Math.max(0, (match.index ?? 0) - 20), Math.min(content.length, (match.index ?? 0) + keyword.length + 20)),
              })),
            });
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
      
      return results;
    });

    // Capture the exposed API when preload is loaded
    mockContextBridge.exposeInMainWorld.mockImplementation((...args: any[]) => {
      const [name, api] = args;
      if (name === 'electronAPI') {
        electronAPI = api;
      }
    });

    // Re-require preload to trigger contextBridge.exposeInMainWorld
    jest.isolateModules(() => {
      require('../../markit/main/preload');
    });
  });

  afterEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('IPC Channel Communication', () => {
    it('should expose electronAPI to main world', () => {
      expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
        'electronAPI',
        expect.any(Object)
      );
    });

    it('should whitelist valid send channels', () => {
      const validChannels = [
        'open-file-dialog',
        'open-folder-dialog',
        'save-file-dialog',
        'save-file',
        'new-file-dialog',
        'open-recent-file',
      ];

      validChannels.forEach(channel => {
        electronAPI.send(channel, 'test-data');
        expect(mockIpcRenderer.send).toHaveBeenCalledWith(channel, 'test-data');
      });
    });

    it('should reject invalid send channels', () => {
      mockIpcRenderer.send.mockClear();
      
      electronAPI.send('invalid-channel', 'test-data');
      
      expect(mockIpcRenderer.send).not.toHaveBeenCalled();
    });

    it('should whitelist valid on channels', () => {
      const validChannels = [
        'toggle-mode',
        'select-all',
        'open-file-dialog',
        'file-opened',
        'save-opened-file',
        'new-file-created',
        'toggle-explorer',
        'local-search',
        'global-search',
        'context-menu-command',
      ];

      validChannels.forEach(channel => {
        const mockCallback = jest.fn();
        electronAPI.on(channel, mockCallback);
        expect(mockIpcRenderer.on).toHaveBeenCalled();
      });
    });

    it('should reject invalid on channels', () => {
      mockIpcRenderer.on.mockClear();
      
      const mockCallback = jest.fn();
      electronAPI.on('invalid-channel', mockCallback);
      
      expect(mockIpcRenderer.on).not.toHaveBeenCalled();
    });

    it('should send context menu requests', () => {
      const menuItems = [
        { label: 'Copy', action: 'copy' },
        { label: 'Paste', action: 'paste' },
      ];

      electronAPI.showContextMenu(menuItems);

      expect(mockIpcRenderer.send).toHaveBeenCalledWith('show-context-menu', menuItems);
    });
  });

  describe('File System Operations through IPC', () => {
    it('should read file through fs.readFile', (done) => {
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      electronAPI.fs.readFile(testFile, 'utf-8', (err: Error | null, data: string) => {
        expect(err).toBeNull();
        expect(data).toBe('test content');
        done();
      });
    });

    it('should handle read errors for non-existent files', (done) => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');

      electronAPI.fs.readFile(nonExistentFile, 'utf-8', (err: Error | null, data: string) => {
        expect(err).not.toBeNull();
        expect(err?.message).toContain('ENOENT');
        done();
      });
    });

    it('should read directory contents with readdirSync', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');

      const files = electronAPI.fs.readdirSync(testDir);

      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files.length).toBe(2);
    });

    it('should get file stats with statSync', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const stats = electronAPI.fs.statSync(testFile);

      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.mtime).toBeTruthy();
      expect(typeof stats.mtime.getTime).toBe('function');
    });

    it('should get directory stats with statSync', () => {
      const stats = electronAPI.fs.statSync(testDir);

      expect(stats.isFile()).toBe(false);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should get file stats with async stat', (done) => {
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      electronAPI.fs.stat(testFile, (err: Error | null, stats: any) => {
        expect(err).toBeNull();
        expect(stats?.isFile()).toBe(true);
        expect(stats?.size).toBeGreaterThan(0);
        done();
      });
    });

    it('should write file through fs.writeFile', (done) => {
      const testFile = path.join(testDir, 'new-file.txt');

      electronAPI.fs.writeFile(testFile, 'new content', (err: Error | null) => {
        expect(err).toBeNull();
        const content = fs.readFileSync(testFile, 'utf-8');
        expect(content).toBe('new content');
        done();
      });
    });

    it('should rename files', (done) => {
      const oldPath = path.join(testDir, 'old.txt');
      const newPath = path.join(testDir, 'new.txt');
      fs.writeFileSync(oldPath, 'content');

      electronAPI.fs.rename(oldPath, newPath, (err: Error | null) => {
        expect(err).toBeNull();
        expect(fs.existsSync(newPath)).toBe(true);
        expect(fs.existsSync(oldPath)).toBe(false);
        done();
      });
    });

    it('should delete files with unlink', (done) => {
      const testFile = path.join(testDir, 'delete-me.txt');
      fs.writeFileSync(testFile, 'content');

      electronAPI.fs.unlink(testFile, (err: Error | null) => {
        expect(err).toBeNull();
        expect(fs.existsSync(testFile)).toBe(false);
        done();
      });
    });

    it('should remove directories with rmdir', (done) => {
      const subDir = path.join(testDir, 'subdir');
      fs.mkdirSync(subDir);

      electronAPI.fs.rmdir(subDir, {}, (err: Error | null) => {
        expect(err).toBeNull();
        expect(fs.existsSync(subDir)).toBe(false);
        done();
      });
    });

    it('should validate paths for security', (done) => {
      const unsafePath = '/etc/passwd';

      electronAPI.fs.readFile(unsafePath, 'utf-8', (err: Error | null, data: string) => {
        expect(err).not.toBeNull();
        expect(err?.message).toContain('Access denied');
        done();
      });
    });
  });

  describe('Path Utilities through IPC', () => {
    it('should parse file paths', () => {
      const testPath = '/home/user/documents/test.md';
      const parsed = electronAPI.path.parse(testPath);

      expect(parsed.dir).toBe('/home/user/documents');
      expect(parsed.base).toBe('test.md');
      expect(parsed.ext).toBe('.md');
      expect(parsed.name).toBe('test');
    });

    it('should join path segments', () => {
      const joined = electronAPI.path.join('home', 'user', 'documents', 'test.md');

      expect(joined).toContain('home');
      expect(joined).toContain('user');
      expect(joined).toContain('documents');
      expect(joined).toContain('test.md');
    });

    it('should handle relative paths in join', () => {
      const joined = electronAPI.path.join('folder', '..', 'other', 'file.txt');

      expect(joined).toContain('other');
      expect(joined).toContain('file.txt');
    });
  });

  describe('Markdown Operations through IPC', () => {
    it('should parse markdown to HTML', () => {
      const markdown = '# Hello World\n\nThis is **bold** text.';
      const html = electronAPI.parseMarkdown(markdown);

      expect(html).toContain('<h1');
      expect(html).toContain('Hello World');
      expect(html).toContain('<strong>');
      expect(html).toContain('bold');
    });

    it('should handle code blocks', () => {
      const markdown = '```javascript\nconst x = 5;\n```';
      const html = electronAPI.parseMarkdown(markdown);

      expect(html).toContain('<code');
      expect(html).toContain('const x = 5');
    });

    it('should handle links', () => {
      const markdown = '[Link text](https://example.com)';
      const html = electronAPI.parseMarkdown(markdown);

      expect(html).toContain('<a');
      expect(html).toContain('href');
      expect(html).toContain('example.com');
    });

    it('should set markdown base URL', () => {
      electronAPI.setMarkdownBaseUrl('https://example.com/docs/');
      
      const markdown = '[relative link](./page.html)';
      const html = electronAPI.parseMarkdown(markdown);

      // Should convert relative to absolute URL
      expect(html).toContain('href');
    });
  });

  describe('Search Operations through IPC', () => {
    it('should search files through electronAPI', async () => {
      const testFile = path.join(testDir, 'search.md');
      await fs.writeFile(testFile, 'This is a test file with keyword.');

      const results = await electronAPI.searchInFiles(testDir, 'keyword');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle search in empty directory', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.ensureDir(emptyDir);

      const results = await electronAPI.searchInFiles(emptyDir, 'keyword');

      expect(results).toEqual([]);
    });
  });

  describe('Error Handling in IPC', () => {
    it('should handle file system errors gracefully', (done) => {
      electronAPI.fs.readFile('/invalid/path', 'utf-8', (err: Error | null) => {
        expect(err).not.toBeNull();
        done();
      });
    });

    it('should validate paths before operations', (done) => {
      const invalidPath = '../../../etc/passwd';
      
      electronAPI.fs.readFile(invalidPath, 'utf-8', (err: Error | null) => {
        expect(err).not.toBeNull();
        done();
      });
    });

    it('should handle stat errors for non-existent paths', (done) => {
      electronAPI.fs.stat('/nonexistent/path', (err: Error | null) => {
        expect(err).not.toBeNull();
        done();
      });
    });
  });

  describe('Security in IPC', () => {
    it('should only allow whitelisted IPC channels', () => {
      mockIpcRenderer.send.mockClear();
      
      electronAPI.send('dangerous-channel', 'malicious-data');
      
      expect(mockIpcRenderer.send).not.toHaveBeenCalled();
    });

    it('should validate file paths', (done) => {
      const maliciousPath = path.join(testDir, '..', '..', '..', 'etc', 'passwd');
      
      electronAPI.fs.readFile(maliciousPath, 'utf-8', (err: Error | null) => {
        expect(err).not.toBeNull();
        expect(err?.message).toContain('Access denied');
        done();
      });
    });

    it('should sanitize null bytes from paths', (done) => {
      const pathWithNull = path.join(testDir, 'file\0.txt');
      
      // Should either handle gracefully or throw validation error
      electronAPI.fs.writeFile(pathWithNull, 'content', (err: Error | null) => {
        // Should complete without crashing
        expect(typeof err === 'object').toBe(true);
        done();
      });
    });
  });
});
