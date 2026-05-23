/**
 * Main Renderer Process Entry Point (Refactored)
 * Initializes and coordinates all renderer modules via extracted orchestrators
 */

import { stateManager } from "./state.js";
import { FileService } from "./services/fileService.js";
import { MarkdownService } from "./services/markdownService.js";
import { EditorModule } from "./modules/editor.js";
import { PreviewModule } from "./modules/preview.js";
import { SearchManager } from "./modules/searchManager.js";
import { FileTreeModule } from "./modules/fileTree.js";
import { AutosaveModule } from "./modules/autosave.js";
import { TocModule } from "./modules/toc.js";
import { WordCountModule } from "./modules/wordCount.js";
import { LineNumbersModule } from "./modules/lineNumbers.js";
import { ExportService } from "./services/exportService.js";
import { TableEditorModule } from "./modules/tableEditor.js";

// Get electron API from window
const {
  send: ipcSend,
  on: ipcOn,
  fs,
  path,
  searchInFiles,
  parseMarkdown,
  setMarkdownBaseUrl,
  export: ipcExport,
  image: ipcImage,
} = (window as any).electronAPI;

// Initialize services
const fileService = new FileService(fs, path);
const markdownService = new MarkdownService({
  parseMarkdown,
  setMarkdownBaseUrl,
});
const exportService = new ExportService(parseMarkdown);

// Default settings
const DEFAULT_SETTINGS = {
  theme: "light" as const,
  fontSize: 14,
  fontFamily: "monospace" as const,
  autosaveEnabled: true,
  autosaveInterval: 30000,
};

// Get DOM elements
const $explorer = document.getElementById("explorer") as HTMLDivElement;
const $editor = document.getElementById("editor") as HTMLTextAreaElement;
const $previewer = document.getElementById("previewer") as HTMLDivElement;
const $tree = document.getElementById("tree") as HTMLUListElement;
const $title = document.querySelector("title") as HTMLTitleElement;
const $main = document.getElementById("main") as HTMLDivElement;
const $modeIndicator = document.getElementById("mode-indicator") as HTMLDivElement;
const $modeIcon = document.getElementById("mode-icon") as HTMLSpanElement;
const $tocPanel = document.getElementById("toc-panel") as HTMLDivElement;
const $tocContainer = document.getElementById("toc-container") as HTMLDivElement;
const $tocCloseBtn = document.getElementById("toc-close-btn") as HTMLButtonElement;
const $wordCountBar = document.getElementById("word-count-bar") as HTMLDivElement;
const $wordCountWords = document.getElementById("word-count-words") as HTMLSpanElement;
const $wordCountChars = document.getElementById("word-count-chars") as HTMLSpanElement;
const $wordCountReadingTime = document.getElementById("word-count-reading-time") as HTMLSpanElement;
const $wordCountReadingTimeRow = document.getElementById("word-count-reading-time-row") as HTMLDivElement;
const $wordCountToggle = document.getElementById("word-count-toggle") as HTMLButtonElement;
const $editorContainer = document.getElementById("editor-container") as HTMLDivElement;
const $lineNumbersGutter = document.getElementById("line-numbers-gutter") as HTMLDivElement;
const $previewerContainer = document.getElementById("previewer-container") as HTMLDivElement;
const $previewLineNumbersGutter = document.getElementById("preview-line-numbers-gutter") as HTMLDivElement;

// Initialize modules
const editorModule = new EditorModule($editor, markdownService, fileService, ipcImage);
const previewModule = new PreviewModule($previewer, markdownService, $previewerContainer, $previewLineNumbersGutter);
const searchManager = new SearchManager($editor, document.getElementById("local-search-result") as HTMLDivElement);
const lineNumbersModule = new LineNumbersModule($lineNumbersGutter, $editor);

// Initialize TOC module
const tocModule = new TocModule($tocPanel, $tocContainer, (id: string) => {
  scrollToSection(id);
});

// Initialize Word Count module
const wordCountModule = new WordCountModule(
  $wordCountBar,
  $wordCountWords,
  $wordCountChars,
  $wordCountReadingTime,
  $wordCountReadingTimeRow,
  $wordCountToggle
);

// Initialize autosave module
const autosaveModule = new AutosaveModule(
  () => editorModule.getContent(),
  document.getElementById("autosave-status") || undefined
);
autosaveModule.enable(30000);

// Initialize file tree module
const fileTreeModule = new FileTreeModule($tree, {
  fileService,
  onFileSelect: (filePath: string) => {
    hideLocalSearch();
    hideGlobalSearch();
    loadFile(filePath);
  },
  onFileCreate: (filePath: string) => {
    console.log(`File created: ${filePath}`);
  },
  onFileUnload: (filePath: string) => {
    unloadFile(filePath);
  },
  getCurrentTitle: () => $title.textContent || "",
  setTitle: (title: string) => {
    $title.textContent = title;
  },
  onFileIconClick: (filePath: string) => {
    hideLocalSearch();
    hideGlobalSearch();
    loadFileContentOnly(filePath);
  },
});

// Store folder root for relative paths
let folderRoot: string | null = null;

/**
 * Update the mode indicator in header
 */
function updateModeIndicator(): void {
  const isEditMode = stateManager.get("isEditMode");
  
  if (isEditMode) {
    $modeIcon.textContent = "✏️";
    $modeIndicator.className = "edit-mode";
    $modeIndicator.title = "Edit Mode";
  } else {
    $modeIcon.textContent = "👀";
    $modeIndicator.className = "preview-mode";
    $modeIndicator.title = "Preview Mode";
  }
}

/**
 * Switch to preview mode
 */
function previewMode(): void {
  stateManager.set("isModeSwitching", true);
  const editorLine = editorModule.getCursorLine();
  const markdownContent = editorModule.getContent();
  previewModule.setMarkdownContent(markdownContent);

  $editorContainer.style.display = "none";
  $previewerContainer.style.display = "flex";
  previewModule.show(false);

  if (lineNumbersModule.visible) {
    previewModule.showLineNumbers();
  }

  if (editorLine >= 0) {
    previewModule.setCursorLine(editorLine);
  }

  stateManager.set("isEditMode", false);
  updateModeIndicator();
  wordCountModule.update(markdownContent);

  setTimeout(() => {
    stateManager.set("isModeSwitching", false);
  }, 100);
}

/**
 * Switch to edit mode
 */
function editMode(): void {
  stateManager.set("isModeSwitching", true);
  
  let previewLine = stateManager.get('previewHoverLine') as number | null;
  if (previewLine === null || previewLine < 0) {
    previewLine = previewModule.getCursorLine();
  }

  const plainText = editorModule.getContent();
  editorModule.setContent(plainText);

  $previewerContainer.style.display = "none";
  $editorContainer.style.display = "flex";
  editorModule.show();

  if (previewLine !== null && previewLine >= 0) {
    editorModule.setCursorLine(previewLine);
  }

  stateManager.set("isEditMode", true);
  updateModeIndicator();
  wordCountModule.update(plainText);

  setTimeout(() => {
    stateManager.set("isModeSwitching", false);
  }, 100);
}

/**
 * Scroll to section in editor or preview
 */
function scrollToSection(id: string): void {
  if (!id) return;

  const isEditMode = stateManager.get("isEditMode");

  if (isEditMode) {
    const content = editorModule.getContent();
    const lines = content.split('\n');
    let targetLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^#{1,6}\s+(.+)$/);
      if (match) {
        const headingText = match[1].trim();
        const slug = headingText
          .toLowerCase()
          .trim()
          .replace(/[^\p{L}\p{N}\s-]/gu, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (slug === id) {
          targetLine = i;
          break;
        }
      }
    }

    if (targetLine !== -1) {
      editorModule.scrollToLine(targetLine);
    }
  } else {
    const $previewElement = $previewer.querySelector(`#${CSS.escape(id)}`);
    if ($previewElement) {
      $previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

/**
 * Toggle TOC panel visibility
 */
function toggleToc(): void {
  const wasVisible = tocModule.visible;
  tocModule.toggle();
  
  if (!wasVisible) {
    $explorer.style.display = "none";
  } else {
    $explorer.style.display = "block";
  }
  
  const content = editorModule.getContent();
  tocModule.update(content);
}

/**
 * Hide local search panel
 */
function hideLocalSearch(): void {
  const $localSearch = document.getElementById("local-search") as HTMLDivElement;
  $localSearch.style.display = "none";
}

/**
 * Hide global search panel
 */
function hideGlobalSearch(): void {
  const $globalSearch = document.getElementById("global-search") as HTMLDivElement;
  const $globalSearchResult = document.getElementById("global-search-result") as HTMLDivElement;
  $globalSearch.style.display = "none";
  $globalSearchResult.style.display = "none";
}

/**
 * Open a document file
 */
async function openDocument(
  filePath: string,
  options: { trackRecent?: boolean; rebuildTree?: boolean } = {}
): Promise<void> {
  const { trackRecent = false, rebuildTree = true } = options;

  try {
    const fileDir = fileService.path.dirname(filePath);
    const baseUrl = "file://" + fileDir + "/";
    markdownService.setBaseUrl(baseUrl);

    const content = await fileService.loadFile(filePath);
    editorModule.setContent(content);
    editorModule.setCurrentFilePath(filePath);

    if (tocModule.visible) {
      tocModule.update(content);
    }

    wordCountModule.update(content);

    if (!stateManager.get("isEditMode")) {
      previewMode();
    }

    $title.textContent = filePath;

    // Track recent files
    if (trackRecent && hasFolderRoot() && fileService.isFile(filePath)) {
      addToRecentFiles(filePath);
    }
  } catch (err) {
    console.error("Error opening document:", err);
  }
}

/**
 * Load a file (with recent file tracking)
 */
async function loadFile(filePath: string): Promise<void> {
  await openDocument(filePath, { trackRecent: true, rebuildTree: true });
}

/**
 * Load file content only without rebuilding the tree
 */
async function loadFileContentOnly(filePath: string): Promise<void> {
  await openDocument(filePath, { trackRecent: false, rebuildTree: false });
}

/**
 * Check if we have a valid folder root
 */
function hasFolderRoot(): boolean {
  const rootDir = fileTreeModule.getRootDirectory();
  return rootDir !== "" && rootDir !== null && rootDir !== undefined;
}

/**
 * Add file to recent files list
 */
function addToRecentFiles(filePath: string): void {
  if (!hasFolderRoot()) return;

  // Use the recent files orchestrator's logic here
  // We'll import it dynamically to avoid circular dependencies
  import('./orchestrators/recentFilesOrchestrator.js').then((module) => {
    module.addToRecentFiles(filePath);
  });
}

/**
 * Unload current file
 */
function unloadFile(filePath: string): void {
  // Reset state when file is closed
  editorModule.setContent("");
  previewModule.setMarkdownContent("");
  $title.textContent = "Markdown Editor";
  wordCountModule.update("");
}

// Update TOC and Word Count when editor content changes
$editor.addEventListener("input", () => {
  if (tocModule.visible) {
    tocModule.update(editorModule.getContent());
  }
  wordCountModule.update(editorModule.getContent());
  if (lineNumbersModule.visible) {
    lineNumbersModule.update();
  }
});

// TOC panel close button
$tocCloseBtn.addEventListener("click", () => {
  tocModule.hide();
  $explorer.style.display = "block";
});

// ============================================================================
// INITIALIZE ORCHESTRATORS
// These extract all modal handling and IPC wiring from renderer.ts
// ============================================================================

// 1. Settings Orchestrator
import { initializeSettings } from './orchestrators/settingsOrchestrator.js';

// 2. Recent Files Orchestrator
import { initializeRecentFilesOrchestrator } from './orchestrators/recentFilesOrchestrator.js';
initializeRecentFilesOrchestrator(fileTreeModule, loadFile, loadFileContentOnly);

// 3. Search Orchestrator
import { initSearch } from './orchestrators/searchOrchestrator.js';
initSearch(searchManager, editorModule, previewModule, fileTreeModule, ipcImage, loadFile);

// 4. Export Orchestrator
import { initializeExportOrchestrator } from './orchestrators/exportOrchestrator.js';
initializeExportOrchestrator(editorModule, exportService);

// 5. Shortcuts Orchestrator
import { initShortcuts } from './orchestrators/shortcutsOrchestrator.js';
initShortcuts();

// 6. Table Orchestrator
import { initTable } from './orchestrators/tableOrchestrator.js';
const tableEditor = new TableEditorModule($editor);
initTable(editorModule, tableEditor);

// 7. IPC Handlers Orchestrator
import { initIPC } from './orchestrators/ipcHandlers.js';
initIPC(
  stateManager,
  editorModule,
  previewModule,
  searchManager,
  fileTreeModule,
  autosaveModule,
  tocModule,
  wordCountModule,
  lineNumbersModule,
  fileService,
  loadFile,
  loadFileContentOnly,
  hideLocalSearch,
  hideGlobalSearch,
  toggleToc,
  () => tocModule.update(editorModule.getContent()),
  () => {
    return stateManager.get("isEditMode")
      ? editorModule.getContent()
      : previewModule.getHtmlContent();
  },
  editMode,
  previewMode,
  scrollToSection,
  addToRecentFiles,
  openDocument,
  ipcOn,
  ipcSend
);

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log("Renderer process initialized");
updateModeIndicator();

// Load settings on startup
initializeSettings();

// Show recent opens menu on startup
ipcSend("open-recent");
