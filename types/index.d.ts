// IPC Message Types
export interface IpcChannels {
  'new-file-dialog': void;
  'open-file-dialog': void;
  'open-folder-dialog': void;
  'save-file-dialog': void;
  'save-file': { filePath: string; content: string };
  'save-opened-file': void;
  'file-opened': string | string[];
  'new-file-created': string;
  'toggle-mode': void;
  'select-all': void;
  'toggle-explorer': void;
  'local-search': void;
  'global-search': void;
  'open-recent-file': void;
  'show-context-menu': MenuItem[];
  'context-menu-command': string;
}

// Menu Item Types
export interface MenuItem {
  label: string;
  id: string;
  accelerator?: string;
  click?: () => void;
}

// File System Types
export interface FileTreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  children?: FileTreeNode[];
}

// Search Result Types
export interface SearchMatch {
  line: number;
  snippet: string;
  context: string;
}

export interface SearchResult {
  file: string;
  matches: SearchMatch[];
}

// Editor State
export interface EditorState {
  isEditMode: boolean;
  editorScrollTop: number;
  editorSelectionStart: number;
  editorSelectionEnd: number;
  previewScrollTop: number;
  previewCursorOffset: number;
}

// Recent Files
export interface RecentFileEntry {
  path: string;
  timestamp: number;
}
