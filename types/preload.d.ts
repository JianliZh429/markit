import { SearchResult } from './index';

export interface ElectronAPI {
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  showContextMenu: (menuItems: any[]) => void;
  fs: {
    readFile: (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => void;
    writeFile: (path: string, data: string, callback: (err: Error | null) => void) => void;
    readdirSync: (path: string) => string[];
    statSync: (path: string) => { isDirectory: () => boolean; isFile: () => boolean };
    stat: (path: string, callback: (err: Error | null, stats: any) => void) => void;
    open: (path: string, flags: string, callback: (err: Error | null) => void) => void;
    rename: (oldPath: string, newPath: string, callback: (err: Error | null) => void) => void;
    rmdir: (dirPath: string, options: any, callback: (err: Error | null) => void) => void;
    unlink: (filePath: string, callback: (err: Error | null) => void) => void;
  };
  path: {
    join: (...paths: string[]) => string;
    parse: (path: string) => { base: string; ext: string; dir: string; name: string; root: string };
  };
  searchInFiles: (directory: string, keyword: string) => Promise<SearchResult[]>;
  replaceInFiles: (
    directory: string,
    searchTerm: string,
    replacement: string,
    fileExtension?: string,
    caseSensitive?: boolean,
    useRegex?: boolean,
  ) => Promise<{ file: string; replacements: number }[]>;
  parseMarkdown: (content: string) => string;
  setMarkdownBaseUrl: (filePath: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
