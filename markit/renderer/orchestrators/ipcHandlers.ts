/**
 * IPC Handlers Orchestrator
 * Handles all ipcOn() registrations organized by category
 */

// Dependencies (injected via init)
let stateManager: any = null;
let editorModule: any = null;
let previewModule: any = null;
let searchManager: any = null;
let fileTreeModule: any = null;
let autosaveModule: any = null;
let tocModule: any = null;
let wordCountModule: any = null;
let lineNumbersModule: any = null;
let fileService: any = null;
let fileOpenHandler: ((filePath: string) => Promise<void>) | null = null;
let loadFileContentOnlyFn: ((filePath: string) => Promise<void>) | null = null;
let hideLocalSearchFn: (() => void) | null = null;
let hideGlobalSearchFn: (() => void) | null = null;
let toggleTocFn: (() => void) | null = null;
let updateTocFn: (() => void) | null = null;
let currentContentFn: (() => string) | null = null;
let editModeFn: (() => void) | null = null;
let previewModeFn: (() => void) | null = null;
let scrollToSectionFn: ((id: string) => void) | null = null;
let addToRecentFilesFn: ((filePath: string) => void) | null = null;
let openDocumentFn: ((filePath: string, options?: { trackRecent?: boolean; rebuildTree?: boolean }) => Promise<void>) | null = null;

// IPC references (set externally since they're destructured in main renderer)
let ipcOnFn: ((channel: string, callback: (...args: any[]) => void) => void) | null = null;
let ipcSendFn: ((channel: string, ...args: any[]) => void) | null = null;

// DOM elements
const $localSearch = document.getElementById("local-search") as HTMLDivElement;
const $globalSearch = document.getElementById("global-search") as HTMLDivElement;
const $globalSearchResult = document.getElementById("global-search-result") as HTMLDivElement;
const $explorer = document.getElementById("explorer") as HTMLDivElement;
const $main = document.getElementById("main") as HTMLDivElement;
const $editorContainer = document.getElementById("editor-container") as HTMLDivElement;
const $previewerContainer = document.getElementById("previewer-container") as HTMLDivElement;
const $title = document.querySelector("title") as HTMLTitleElement;

// Initialize with dependencies
export function initIPC(
  _stateManager: any,
  _editorModule: any,
  _previewModule: any,
  _searchManager: any,
  _fileTreeModule: any,
  _autosaveModule: any,
  _tocModule: any,
  _wordCountModule: any,
  _lineNumbersModule: any,
  _fileService: any,
  _fileOpenHandler: (filePath: string) => Promise<void>,
  _loadFileContentOnlyFn: (filePath: string) => Promise<void>,
  _hideLocalSearchFn: () => void,
  _hideGlobalSearchFn: () => void,
  _toggleTocFn: () => void,
  _updateTocFn: () => void,
  _currentContentFn: () => string,
  _editModeFn: () => void,
  _previewModeFn: () => void,
  _scrollToSectionFn: (id: string) => void,
  _addToRecentFilesFn: (filePath: string) => void,
  _openDocumentFn: (filePath: string, options?: { trackRecent?: boolean; rebuildTree?: boolean }) => Promise<void>,
  _ipcOnFn: (channel: string, callback: (...args: any[]) => void) => void,
  _ipcSendFn: (channel: string, ...args: any[]) => void
): void {
  stateManager = _stateManager;
  editorModule = _editorModule;
  previewModule = _previewModule;
  searchManager = _searchManager;
  fileTreeModule = _fileTreeModule;
  autosaveModule = _autosaveModule;
  tocModule = _tocModule;
  wordCountModule = _wordCountModule;
  lineNumbersModule = _lineNumbersModule;
  fileService = _fileService;
  fileOpenHandler = _fileOpenHandler;
  loadFileContentOnlyFn = _loadFileContentOnlyFn;
  hideLocalSearchFn = _hideLocalSearchFn;
  hideGlobalSearchFn = _hideGlobalSearchFn;
  toggleTocFn = _toggleTocFn;
  updateTocFn = _updateTocFn;
  currentContentFn = _currentContentFn;
  editModeFn = _editModeFn;
  previewModeFn = _previewModeFn;
  scrollToSectionFn = _scrollToSectionFn;
  addToRecentFilesFn = _addToRecentFilesFn;
  openDocumentFn = _openDocumentFn;
  ipcOnFn = _ipcOnFn;
  ipcSendFn = _ipcSendFn;
  
  // Register all IPC handlers
  registerFileHandlers();
  registerViewHandlers();
  registerSearchHandlers();
  registerEditHandlers();
  registerModalHandlers();
}

function registerFileHandlers(): void {
  if (!ipcOnFn || !ipcSendFn) return;
  
  const send = ipcSendFn!; // Safe since we checked above
  
  // File dialog operations
  ipcOnFn("open-file-dialog", () => {
    send("open-file-dialog");
  });
  
  ipcOnFn("open-folder-dialog", () => {
    send("open-folder-dialog");
  });
  
  ipcOnFn("file-opened", (args: string | string[]) => {
    const filePath = typeof args === "string" ? args : args[0];
    
    // Check if opening a folder (sets root) or a file
    if (fileService.isDirectory(filePath)) {
      stateManager.set("rootDirectory", filePath);
      
      // Update editor's folder root for image drop
      editorModule?.setFolderRoot(filePath);
      
      console.log(`Folder opened: ${filePath}`);
    }
    
    // Load the file/folder through fileTreeModule
    fileTreeModule.loadFileOrFolder(filePath);
  });
  
  ipcOnFn("save-opened-file", async () => {
    const openedFilePath = $title.textContent;
    if (!openedFilePath || openedFilePath === "Markdown Editor") {
      console.warn("No file is currently opened");
      return;
    }
    
    const content = editorModule.getContent();
    try {
      await fileService.saveFile(openedFilePath, content);
      console.log(`File ${openedFilePath} saved successfully`);
    } catch (err) {
      console.error("Error saving file:", err);
    }
  });
  
  ipcOnFn("save-file-dialog", () => {
    send("save-file-dialog");
  });
  
  ipcOnFn("save-file", async (filePath: string) => {
    send("save-file", filePath, editorModule.getContent());
  });
  
  ipcOnFn("new-file-dialog", () => {
    send("new-file-dialog");
  });
  
  ipcOnFn("new-file-created", async (filePath: string) => {
    try {
      await fileService.createFile(filePath);
      await fileOpenHandler!(filePath);
      console.log(`File ${filePath} created successfully`);
    } catch (err) {
      console.error("Error creating file:", err);
    }
  });
  
  // Folder closed
  ipcOnFn("folder-closed", () => {
    stateManager.set("rootDirectory", null);
    console.log("Folder closed");
  });
}

function registerViewHandlers(): void {
  if (!ipcOnFn) return;
  
  ipcOnFn("toggle-explorer", () => {
    if ($explorer.style.display === "none") {
      $explorer.style.display = "block";
    } else {
      $explorer.style.display = "none";
    }
  });
  
  ipcOnFn("toggle-toc", () => {
    toggleTocFn?.();
  });
  
  ipcOnFn("toggle-word-count", () => {
    wordCountModule.toggle();
  });
  
  ipcOnFn("toggle-line-numbers", () => {
    lineNumbersModule.toggle();
    const isVisible = lineNumbersModule.visible;
    stateManager.set("isLineNumbersVisible", isVisible);
    if (isVisible) {
      previewModule.showLineNumbers();
    } else {
      previewModule.hideLineNumbers();
    }
  });
  
  ipcOnFn("open-settings", () => {
    // Import and call settings modal
    import('./settingsOrchestrator.js').then((module) => {
      module.showSettingsModal();
    });
  });
  
  ipcOnFn("show-keyboard-shortcuts", () => {
    import('./shortcutsOrchestrator.js').then((module) => {
      module.showKeyboardShortcutsModal();
    });
  });
  
  ipcOnFn("export-document", () => {
    import('./exportOrchestrator.js').then((module) => {
      module.showExportModal();
    });
  });
  
  ipcOnFn("insert-table", () => {
    import('./tableOrchestrator.js').then((module) => {
      module.showInsertTableModal();
    });
  });
}

function registerSearchHandlers(): void {
  if (!ipcOnFn) return;
  
  ipcOnFn("local-search", () => {
    import('./searchOrchestrator.js').then((module) => {
      module.handleLocalSearch();
    });
  });
  
  ipcOnFn("global-search", () => {
    import('./searchOrchestrator.js').then((module) => {
      module.handleGlobalSearch();
    });
  });
}

function registerEditHandlers(): void {
  if (!ipcOnFn) return;
  
  ipcOnFn("toggle-mode", () => {
    const isEditMode = stateManager.get("isEditMode");
    stateManager.set("isEditMode", !isEditMode);
    $localSearch.style.display = "none";
    
    if (stateManager.get("isEditMode")) {
      editModeFn?.();
    } else {
      previewModeFn?.();
    }
  });
  
  ipcOnFn("select-all", () => {
    const activeElement = document.activeElement;
    
    if (activeElement?.id === "local-search-input" || activeElement?.id === "global-search-input") {
      (activeElement as HTMLInputElement).select();
    } else if (stateManager.get("isEditMode")) {
      editorModule.selectAll();
    } else {
      previewModule.selectAll();
    }
  });
  
  ipcOnFn("switch-recent-file", () => {
    // Check if we have a folder root
    const rootDir = fileTreeModule?.getRootDirectory();
    if (rootDir && rootDir !== "" && rootDir !== null) {
      import('./recentFilesOrchestrator.js').then((module) => {
        module.showRecentFilesModal();
      });
    }
  });
}

function registerModalHandlers(): void {
  if (!ipcOnFn) return;
  
  // Modal-related handlers can be registered here if needed
  // Most modals now handle their own events via their respective orchestrators
}
