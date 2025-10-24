/**
 * File Service
 * Handles all file system operations
 */

import { stateManager } from "../state";

export interface FileSystemAPI {
  readFile: (
    path: string,
    encoding: string,
    callback: (err: Error | null, data: string) => void,
  ) => void;
  writeFile: (
    path: string,
    content: string,
    callback: (err: Error | null) => void,
  ) => void;
  stat: (
    path: string,
    callback: (err: Error | null, stats?: any) => void,
  ) => void;
  statSync: (path: string) => any;
  readdirSync: (path: string) => string[];
  open: (
    path: string,
    flags: string,
    callback: (err: Error | null) => void,
  ) => void;
  rename: (
    oldPath: string,
    newPath: string,
    callback: (err: Error | null) => void,
  ) => void;
  unlink: (path: string, callback: (err: Error | null) => void) => void;
  rmdir: (
    path: string,
    options: { recursive?: boolean; force?: boolean },
    callback: (err: Error | null) => void,
  ) => void;
}

export interface PathAPI {
  parse: (path: string) => {
    dir: string;
    base: string;
    ext: string;
    name: string;
  };
  join: (...paths: string[]) => string;
}

export class FileService {
  constructor(
    private fs: FileSystemAPI,
    private path: PathAPI,
  ) {}

  /**
   * Load file content
   */
  async loadFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          reject(err);
        } else {
          stateManager.set("currentFilePath", filePath);
          resolve(data);
        }
      });
    });
  }

  /**
   * Save file content
   */
  async saveFile(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // First check if file exists
      this.fs.stat(filePath, (statErr) => {
        if (!statErr) {
          // File exists, write to it
          this.fs.writeFile(filePath, content, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        } else {
          reject(new Error("File does not exist"));
        }
      });
    });
  }

  /**
   * Create new file
   */
  async createFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fs.open(filePath, "w", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if path is a directory
   */
  isDirectory(filePath: string): boolean {
    try {
      const stats = this.fs.statSync(filePath);
      return stats.isDirectory();
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if path is a file
   */
  isFile(filePath: string): boolean {
    try {
      const stats = this.fs.statSync(filePath);
      return stats.isFile();
    } catch (err) {
      return false;
    }
  }

  /**
   * List directory contents
   */
  listDirectory(dirPath: string): string[] {
    try {
      const files = this.fs.readdirSync(dirPath);
      return files.map((file) => this.path.join(dirPath, file));
    } catch (err) {
      console.error("Error listing directory:", err);
      return [];
    }
  }

  /**
   * Get markdown files from directory
   */
  getMarkdownFiles(dirPath: string): string[] {
    const files = this.listDirectory(dirPath);
    return files.filter((file) => {
      const parsed = this.path.parse(file);
      return parsed.ext.toLowerCase() === ".md";
    });
  }

  /**
   * Parse file path
   */
  parsePath(filePath: string): {
    dir: string;
    base: string;
    ext: string;
    name: string;
  } {
    return this.path.parse(filePath);
  }

  /**
   * Join path segments
   */
  joinPath(...paths: string[]): string {
    return this.path.join(...paths);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.fs.stat(filePath, (err) => {
        resolve(!err);
      });
    });
  }

  /**
   * Rename file or directory
   */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fs.rename(oldPath, newPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // Update state if the renamed file is currently open
          const currentFilePath = stateManager.get("currentFilePath");
          if (currentFilePath === oldPath) {
            stateManager.set("currentFilePath", newPath);
          }
          resolve();
        }
      });
    });
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          // Clear state if deleted file was currently open
          const currentFilePath = stateManager.get("currentFilePath");
          if (currentFilePath === filePath) {
            stateManager.set("currentFilePath", null);
          }
          resolve();
        }
      });
    });
  }

  /**
   * Delete directory recursively
   */
  async deleteDirectory(dirPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fs.rmdir(dirPath, { recursive: true, force: true }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
