/**
 * Main Renderer Process Entry Point (Refactored)
 * Initializes and coordinates all renderer modules
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

// Get electron API from window
const {
  send: ipcSend,
  on: ipcOn,
  fs,
  path,
  searchInFiles,
  parseMarkdown,
  setMarkdownBaseUrl,
} = (window as any).electronAPI;

// Initialize services
const fileService = new FileService(fs, path);
const markdownService = new MarkdownService({
  parseMarkdown,
  setMarkdownBaseUrl,
});

// Default settings (can be overridden by main process via IPC)
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
const $localSearch = document.getElementById("local-search") as HTMLDivElement;
const $localSearchInput = document.getElementById(
  "local-search-input",
) as HTMLInputElement;
const $localSearchResult = document.getElementById(
  "local-search-result",
) as HTMLDivElement;
const $globalSearch = document.getElementById(
  "global-search",
) as HTMLDivElement;
const $globalSearchInput = document.getElementById(
  "global-search-input",
) as HTMLInputElement;
const $globalSearchResult = document.getElementById(
  "global-search-result",
) as HTMLDivElement;
const $main = document.getElementById("main") as HTMLDivElement;
const $modeIndicator = document.getElementById("mode-indicator") as HTMLDivElement;
const $modeIcon = document.getElementById("mode-icon") as HTMLSpanElement;

// TOC Panel elements
const $tocPanel = document.getElementById("toc-panel") as HTMLDivElement;
const $tocContainer = document.getElementById("toc-container") as HTMLDivElement;
const $tocCloseBtn = document.getElementById("toc-close-btn") as HTMLButtonElement;

// Word Count elements
const $wordCountBar = document.getElementById("word-count-bar") as HTMLDivElement;
const $wordCountWords = document.getElementById("word-count-words") as HTMLSpanElement;
const $wordCountChars = document.getElementById("word-count-chars") as HTMLSpanElement;
const $wordCountReadingTime = document.getElementById("word-count-reading-time") as HTMLSpanElement;
const $wordCountReadingTimeRow = document.getElementById("word-count-reading-time-row") as HTMLDivElement;
const $wordCountToggle = document.getElementById("word-count-toggle") as HTMLButtonElement;

// Initialize modules
const editorModule = new EditorModule($editor, markdownService);
const previewModule = new PreviewModule($previewer, markdownService);
const searchManager = new SearchManager($editor, $localSearchResult);

// Initialize TOC module
const tocModule = new TocModule($tocPanel, $tocContainer, (id: string) => {
  // Handle TOC item click - scroll to section
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

// TOC panel close button
$tocCloseBtn.addEventListener("click", () => {
  tocModule.hide();
  // Show Explorer when TOC is closed
  $explorer.style.display = "block";
});

// Update TOC and Word Count when editor content changes
$editor.addEventListener("input", () => {
  if (tocModule.visible) {
    updateToc();
  }
  wordCountModule.update(editorModule.getContent());
});

// Initialize autosave module
const autosaveModule = new AutosaveModule(
  () => editorModule.getContent(),
  document.getElementById("autosave-status") || undefined
);

// Try to load autosave if no file is currently open (main process handles this)
// This is a placeholder - actual loading happens in main process

// Enable autosave by default
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
    // File created, will be loaded after rename
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
    // Single click on file icon - load content without rebuilding tree
    hideLocalSearch();
    hideGlobalSearch();
    loadFileContentOnly(filePath);
  },
});

/**
 * Get current content based on mode
 */
function currentContent(): string {
  return stateManager.get("isEditMode")
    ? editorModule.getContent()
    : previewModule.getHtmlContent();
}

/**
 * Update the mode indicator in header
 */
function updateModeIndicator(): void {
  const isEditMode = stateManager.get("isEditMode");
  
  // Update icon and styling based on mode
  if (isEditMode) {
    $modeIcon.textContent = "✏️"; // Pencil icon for edit mode (monochrome)
    $modeIndicator.className = "edit-mode";
    $modeIndicator.title = "Edit Mode";
  } else {
    $modeIcon.textContent = "👀"; // Circle/eye icon for preview mode (monochrome)
    $modeIndicator.className = "preview-mode";
    $modeIndicator.title = "Preview Mode";
  }
}

/**
 * Switch to preview mode
 * Preview mode is READ-ONLY for viewing rendered markdown
 */
function previewMode(): void {
  // Set mode switching flag to prevent input handler interference
  stateManager.set("isModeSwitching", true);

  // Save cursor position from editor before switching
  const editorCursorOffset = editorModule.getCursorOffset();

  // Get content from editor
  const markdownContent = editorModule.getContent();
  previewModule.setMarkdownContent(markdownContent);

  // Hide editor, show preview (READ-ONLY)
  editorModule.hide();
  previewModule.show(false); // Read-only mode

  // Sync cursor position to preview and center view
  // Note: We use a simple character offset sync
  previewModule.setCursorPosition(editorCursorOffset);

  stateManager.set("isEditMode", false);

  // Update mode indicator
  updateModeIndicator();

  // Update word count
  wordCountModule.update(markdownContent);

  // Clear mode switching flag after a brief delay
  setTimeout(() => {
    stateManager.set("isModeSwitching", false);
  }, 100);
}

/**
 * Switch to edit mode
 * FIX: Sync cursor position from preview and center view
 */
function editMode(): void {
  // Set mode switching flag to prevent input handler interference
  stateManager.set("isModeSwitching", true);

  // Save cursor position from preview before switching
  const previewCursorOffset = previewModule.getCursorOffset();

  // Get content from editor (preview is read-only, no changes)
  const plainText = editorModule.getContent();
  editorModule.setContent(plainText);

  // Hide preview, show editor
  previewModule.hide();
  editorModule.show();

  // Sync cursor position to editor and center view
  editorModule.setCursorPosition(previewCursorOffset);

  stateManager.set("isEditMode", true);

  // Update mode indicator
  updateModeIndicator();

  // Update word count
  wordCountModule.update(plainText);

  // Clear mode switching flag after a brief delay
  setTimeout(() => {
    stateManager.set("isModeSwitching", false);
  }, 100);
}

/**
 * Hide local search panel
 */
function hideLocalSearch(): void {
  $localSearch.style.display = "none";
}

/**
 * Hide global search panel
 */
function hideGlobalSearch(): void {
  $globalSearch.style.display = "none";
  $globalSearchResult.style.display = "none";
}

/**
 * Scroll to section in editor or preview
 */
function scrollToSection(id: string): void {
  // Skip if id is empty
  if (!id) {
    return;
  }

  const isEditMode = stateManager.get("isEditMode");

  if (isEditMode) {
    // In edit mode, scroll to the heading in the textarea
    const content = editorModule.getContent();
    const lines = content.split('\n');
    let targetLine = -1;

    // Find the line with the heading
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match heading with the given id (slugified)
      const match = line.match(/^#{1,6}\s+(.+)$/);
      if (match) {
        const headingText = match[1].trim();
        // Use same slugify logic as TOC module (Unicode-safe)
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
    // In preview mode, scroll to the element in the preview
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
  
  // Toggle Explorer panel opposite to TOC
  if (!wasVisible) {
    // TOC is now shown, hide Explorer
    $explorer.style.display = "none";
  } else {
    // TOC is now hidden, show Explorer
    $explorer.style.display = "block";
  }
  
  // Update TOC content when toggled
  const content = editorModule.getContent();
  tocModule.update(content);
}

/**
 * Update TOC from current content
 */
function updateToc(): void {
  const content = editorModule.getContent();
  tocModule.update(content);
}

/**
 * Check if global search is active
 */
function isGlobalSearchOn(): boolean {
  return (
    $globalSearch.style.display !== "none" ||
    $globalSearchResult.style.display !== "none"
  );
}

/**
 * Load a file
 */
async function loadFile(filePath: string): Promise<void> {
  try {
    markdownService.setBaseUrl(filePath);
    const content = await fileService.loadFile(filePath);
    editorModule.setContent(content);

    // Update TOC if visible
    if (tocModule.visible) {
      updateToc();
    }

    // Update word count
    wordCountModule.update(content);

    if (!stateManager.get("isEditMode")) {
      previewMode();
    }

    $title.textContent = filePath;

    // Track recent files (only when folder root exists)
    if (hasFolderRoot() && fileService.isFile(filePath)) {
      // Add to recent files list (at the beginning)
      const index = recentFilesList.indexOf(filePath);
      if (index !== -1) {
        recentFilesList.splice(index, 1);
      }
      recentFilesList.unshift(filePath);
      // Limit to 10 recent files
      if (recentFilesList.length > 10) {
        recentFilesList.pop();
      }
      currentRecentFileIndex = 0;
      console.log(`Added to recent files: ${filePath} (total: ${recentFilesList.length})`);
    }
  } catch (err) {
    console.error("Error loading file:", err);
  }
}

/**
 * Unload a file
 */
function unloadFile(filePath: string): void {
  if ($title.textContent === filePath) {
    $title.textContent = "Markdown Editor";
    editorModule.setContent("");
    
    // Reset word count
    wordCountModule.update("");
    
    if (!stateManager.get("isEditMode")) {
      previewMode();
    }
  }
}

/**
 * Local search
 */
function localSearch(searchTerm: string): void {
  hideGlobalSearch();
  const content = currentContent();
  const regex = new RegExp(searchTerm, "gi");
  const matches = content.match(regex);

  if (matches) {
    console.log(`Found ${matches.length} matches for "${searchTerm}"`);
    const highlightedContent = content.replace(
      regex,
      (match) => `<mark>${match}</mark>`,
    );
    $localSearchResult.innerHTML = highlightedContent;
  } else {
    console.log(`No matches found for "${searchTerm}"`);
  }
}

/**
 * Global search
 */
async function globalSearch(keyword: string): Promise<void> {
  hideLocalSearch();
  const rootDir = fileTreeModule.getRootDirectory();
  const results = await searchInFiles(rootDir, keyword);
  console.log("Search results:", results);

  // Group results by file with collapsible sections
  $globalSearchResult.innerHTML = results
    .map((result: any) => {
      const matchCount = result.matches.length;
      
      return `
        <div class="search-file-group" data-file="${result.file}">
          <div class="search-file-header">
            <span class="search-file-icon">▶</span>
            <span class="search-file-path">${result.file}</span>
            <span class="search-match-count">${matchCount} match${matchCount > 1 ? 'es' : ''}</span>
          </div>
          <div class="search-file-matches">
            ${result.matches.map((match: any) => `
              <div class="search-match-item" data-line="${match.line}">
                ...${match.snippet}...
              </div>
            `).join("")}
          </div>
        </div>
      `;
    })
    .join("");
  
  // Add click handlers for file groups (expand/collapse)
  $globalSearchResult.querySelectorAll(".search-file-header").forEach((header) => {
    header.addEventListener("click", () => {
      const group = header.parentElement as HTMLElement;
      const matches = group.querySelector(".search-file-matches") as HTMLElement;
      const isExpanded = matches.classList.contains("expanded");
      
      // Toggle expanded state
      matches.classList.toggle("expanded");
      header.classList.toggle("expanded");
    });
    
    // Double-click to open file
    header.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const group = header.parentElement as HTMLElement;
      const filePath = group.dataset.file;
      if (filePath) {
        // Close search and open file
        hideGlobalSearch();
        $previewer.style.display = "block";
        $editor.style.display = "none";
        loadFile(filePath);
      }
    });
  });
  
  // Add click handlers for match items (open file at specific location)
  $globalSearchResult.querySelectorAll(".search-match-item").forEach((item) => {
    item.addEventListener("dblclick", () => {
      const group = item.closest(".search-file-group") as HTMLElement;
      const filePath = group?.dataset.file;
      const line = parseInt(item.dataset.line || "0", 10);
      
      if (filePath) {
        // Close search and open file at specific line
        hideGlobalSearch();
        $previewer.style.display = "block";
        $editor.style.display = "none";
        loadFile(filePath);
        // TODO: Scroll to specific line after file loads
      }
    });
  });
  
  $globalSearchResult.style.display = "block";
}

// Event Listeners
$localSearchInput.addEventListener("keydown", (event) => {
  if (event.code === "Enter") {
    const searchTerm = (event.target as HTMLInputElement).value;
    localSearch(searchTerm);
  }
});

$globalSearchInput.addEventListener("keydown", async (event) => {
  if (event.code === "Enter") {
    const keyword = (event.target as HTMLInputElement).value;
    await globalSearch(keyword);
  }
});

// IPC Event Handlers
ipcOn("toggle-mode", () => {
  const isEditMode = stateManager.get("isEditMode");
  stateManager.set("isEditMode", !isEditMode);
  $localSearch.style.display = "none";

  if (stateManager.get("isEditMode")) {
    editMode();
  } else {
    previewMode();
  }
});

ipcOn("select-all", () => {
  const activeElement = document.activeElement;

  if (
    activeElement === $localSearchInput ||
    activeElement === $globalSearchInput
  ) {
    (activeElement as HTMLInputElement).select();
  } else if (stateManager.get("isEditMode")) {
    editorModule.selectAll();
  } else {
    previewModule.selectAll();
  }
});

ipcOn("open-file-dialog", () => {
  ipcSend("open-file-dialog");
});

ipcOn("open-folder-dialog", () => {
  ipcSend("open-folder-dialog");
});

ipcOn("file-opened", (args: string | string[]) => {
  console.log("file-opened:", args);
  const filePath = typeof args === "string" ? args : args[0];
  fileTreeModule.loadFileOrFolder(filePath);
});

ipcOn("save-opened-file", async () => {
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

ipcOn("save-file-dialog", () => {
  ipcSend("save-file-dialog");
});

ipcOn("save-file", async (filePath: string) => {
  ipcSend("save-file", filePath, editorModule.getContent());
});

ipcOn("new-file-dialog", () => {
  ipcSend("new-file-dialog");
});

ipcOn("new-file-created", async (filePath: string) => {
  try {
    await fileService.createFile(filePath);
    loadFile(filePath);
    console.log(`File ${filePath} created successfully`);
  } catch (err) {
    console.error("Error creating file:", err);
  }
});

ipcOn("toggle-explorer", () => {
  if ($explorer.style.display === "none") {
    $explorer.style.display = "block";
  } else {
    $explorer.style.display = "none";
  }
});

ipcOn("toggle-toc", () => {
  toggleToc();
});

ipcOn("toggle-word-count", () => {
  wordCountModule.toggle();
});

ipcOn("local-search", () => {
  if ($localSearch.style.display === "none") {
    $localSearch.style.display = "block";
    $localSearchInput.focus();
    $localSearchResult.innerHTML = currentContent();
    $previewer.style.display = "none";
    $editor.style.display = "none";
    hideGlobalSearch();
    $main.classList.add("search-active");  // Hide mode indicator
  } else {
    $localSearch.style.display = "none";
    $previewer.style.display = "block";
    $editor.style.display = "none";
    searchManager.clear();
    $main.classList.remove("search-active");  // Show mode indicator
  }
});

// Handle search input
$localSearchInput.addEventListener("input", () => {
  const searchTerm = $localSearchInput.value;
  const content = currentContent();
  searchManager.search(content, searchTerm);
});

// Handle Find Next (Enter in search box)
$localSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (event.shiftKey) {
      searchManager.findPrevious();
    } else {
      searchManager.findNext();
    }
  }
});

// Global shortcut for Find Next/Previous (F3, Shift+F3, Cmd+G, Cmd+Shift+G)
document.addEventListener("keydown", (event) => {
  // F3 for Find Next/Previous
  if (event.key === "F3") {
    event.preventDefault();
    if (searchManager.hasActiveSearch()) {
      if (event.shiftKey) {
        searchManager.findPrevious();
      } else {
        searchManager.findNext();
      }
    } else {
      // If no active search, open search panel
      $localSearch.style.display = "block";
      $localSearchInput.focus();
      $previewer.style.display = "none";
      $editor.style.display = "none";
      $main.classList.add("search-active");
    }
  }
  
  // Cmd+G / Ctrl+G for Find Next
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "g") {
    event.preventDefault();
    if (searchManager.hasActiveSearch()) {
      if (event.shiftKey) {
        searchManager.findPrevious();
      } else {
        searchManager.findNext();
      }
    }
  }
});

ipcOn("global-search", () => {
  if (isGlobalSearchOn()) {
    hideGlobalSearch();
    $previewer.style.display = "block";
    $editor.style.display = "none";
    $main.classList.remove("search-active");
  } else {
    $globalSearch.style.display = "block";
    $globalSearchInput.focus();
    $globalSearchResult.innerHTML = "";  // Clear previous results
    $globalSearchResult.style.display = "none";
    $previewer.style.display = "none";
    $editor.style.display = "none";
    $main.classList.add("search-active");
  }
});

// Recent Files Switcher Modal - macOS Style
// Only works when a folder is opened as root in the tree view
let recentFilesList: string[] = [];
let currentRecentFileIndex = 0;
let isModalVisible = false;
let isControlKeyDown = false;
let hasNavigated = false; // Track if user has navigated with Tab

// Get modal DOM elements
const $recentFilesModal = document.getElementById("recent-files-modal") as HTMLDivElement;
const $recentFilesList = document.getElementById("recent-files-list") as HTMLUListElement;

// Check if we have a valid folder root (recent files only work with folder root)
function hasFolderRoot(): boolean {
  const rootDir = fileTreeModule.getRootDirectory();
  return rootDir !== "" && rootDir !== null && rootDir !== undefined;
}

// Handle file-opened event from IPC
ipcOn("file-opened", (args: string | string[]) => {
  console.log("file-opened:", args);
  const filePath = typeof args === "string" ? args : args[0];

  // Check if opening a folder (sets root) or a file
  if (fileService.isDirectory(filePath)) {
    // Folder opened - set as root and clear recent files for new context
    stateManager.set("rootDirectory", filePath);
    recentFilesList = [];
    currentRecentFileIndex = 0;
    console.log(`Folder opened, recent files cleared: ${filePath}`);
  }
  
  // Load the file/folder through fileTreeModule
  fileTreeModule.loadFileOrFolder(filePath);
});

// Show the recent files modal
function showRecentFilesModal(): void {
  // Only show modal if we have a folder root
  if (!hasFolderRoot()) {
    console.log("Recent files switcher only works when a folder is opened");
    return;
  }
  
  renderRecentFilesModal();
  $recentFilesModal.style.display = "flex";
  isModalVisible = true;
  hasNavigated = false; // Reset navigation flag
}

// Hide the recent files modal and open selected file
function hideRecentFilesModal(): void {
  $recentFilesModal.style.display = "none";
  isModalVisible = false;
  isControlKeyDown = false;
  hasNavigated = false;
  
  // Only open file if we have a folder root
  if (!hasFolderRoot()) {
    return;
  }
  
  // Open the currently selected file (if any)
  if (recentFilesList.length > 0) {
    const filePath = recentFilesList[currentRecentFileIndex];
    // First, select and scroll to the file in the tree
    const foundInTree = fileTreeModule.selectFileInTree(filePath);
    if (foundInTree) {
      console.log(`Selected recent file in tree: ${filePath}`);
      // Load just the file content, don't reload the tree
      loadFileContentOnly(filePath);
    } else {
      // File not in tree, load it normally (rebuilds tree)
      try {
        fileTreeModule.loadFileOrFolder(filePath);
        console.log(`Loaded recent file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to load recent file ${filePath}:`, error);
        // Remove invalid file from list
        recentFilesList.splice(currentRecentFileIndex, 1);
        if (recentFilesList.length > 0) {
          currentRecentFileIndex = currentRecentFileIndex % recentFilesList.length;
        }
      }
    }
  }
}

/**
 * Load file content only without reloading the tree
 * Used for recent files switching
 */
async function loadFileContentOnly(filePath: string): Promise<void> {
  try {
    markdownService.setBaseUrl(filePath);
    const content = await fileService.loadFile(filePath);
    editorModule.setContent(content);

    // Update TOC if visible
    if (tocModule.visible) {
      updateToc();
    }

    // Update word count
    wordCountModule.update(content);

    if (!stateManager.get("isEditMode")) {
      previewMode();
    }

    $title.textContent = filePath;
    console.log(`Loaded file content: ${filePath}`);
  } catch (err) {
    console.error("Error loading file content:", err);
  }
}

// Cancel the modal without opening any file
function cancelRecentFilesModal(): void {
  $recentFilesModal.style.display = "none";
  isModalVisible = false;
  isControlKeyDown = false;
  hasNavigated = false;
}

// Render the recent files modal content
function renderRecentFilesModal(): void {
  // Check if we have a folder root
  if (!hasFolderRoot()) {
    $recentFilesList.innerHTML = '<li class="recent-files-empty">Recent files only available when a folder is opened</li>';
    return;
  }
  
  if (recentFilesList.length === 0) {
    $recentFilesList.innerHTML = '<li class="recent-files-empty">No recent files in this folder</li>';
    return;
  }

  $recentFilesList.innerHTML = recentFilesList
    .map((filePath, index) => {
      const parsedPath = path.parse(filePath);
      const fileName = parsedPath.base;
      const dirName = parsedPath.dir;
      const isSelected = index === currentRecentFileIndex;
      return `
        <li class="${isSelected ? "selected" : ""}" data-index="${index}">
          <span class="recent-file-icon">📄</span>
          <span class="recent-file-path" title="${filePath}">${fileName}</span>
          <span class="recent-file-name">${dirName}</span>
        </li>
      `;
    })
    .join("");

  // Add click handlers
  $recentFilesList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const index = parseInt(li.getAttribute("data-index") || "0", 10);
      currentRecentFileIndex = index;
      hideRecentFilesModal();
    });
  });
}

// Navigate to next recent file (forward)
function navigateNextRecentFile(): void {
  if (recentFilesList.length === 0) return;
  
  // Circular navigation: go to next, wrap around at end
  currentRecentFileIndex = (currentRecentFileIndex + 1) % recentFilesList.length;
  hasNavigated = true;
  renderRecentFilesModal();
}

// Navigate to previous recent file (backward)
function navigatePreviousRecentFile(): void {
  if (recentFilesList.length === 0) return;
  
  // Circular navigation: go to previous, wrap around at beginning
  currentRecentFileIndex = (currentRecentFileIndex - 1 + recentFilesList.length) % recentFilesList.length;
  hasNavigated = true;
  renderRecentFilesModal();
}

// Handle keyboard events for modal navigation
document.addEventListener("keydown", (event) => {
  // Check if Ctrl or Cmd is held
  const isControlOrCmd = event.ctrlKey || event.metaKey;
  
  // Handle Ctrl/Cmd key press
  if (event.key === "Control" || event.key === "Meta") {
    isControlKeyDown = true;
    return;
  }
  
  // Handle Ctrl/Cmd + Tab for recent files modal
  if (isControlOrCmd && event.key === "Tab") {
    // Only handle if we have a folder root
    if (!hasFolderRoot()) {
      // Let the default behavior happen (browser tab switching)
      return;
    }
    
    event.preventDefault();
    
    if (!isModalVisible) {
      // First Tab press: show modal
      showRecentFilesModal();
    } else {
      // Subsequent Tab presses: navigate
      if (event.shiftKey) {
        // Ctrl+Shift+Tab: navigate backwards
        navigatePreviousRecentFile();
      } else {
        // Ctrl+Tab: navigate forwards
        navigateNextRecentFile();
      }
    }
  }
});

// Handle key release to confirm selection
document.addEventListener("keyup", (event) => {
  // Track control key state
  if (event.key === "Control" || event.key === "Meta") {
    const wasControlKeyDown = isControlKeyDown;
    isControlKeyDown = false;
    
    // When Ctrl/Cmd is released and modal is visible, open selected file or close
    if (wasControlKeyDown && isModalVisible) {
      if (recentFilesList.length > 0) {
        // Open the selected file
        hideRecentFilesModal();
      } else {
        // No recent files, just close the modal
        cancelRecentFilesModal();
      }
    }
  }
});

// Listen for switch-recent-file command from menu accelerator (fallback)
ipcOn("switch-recent-file", () => {
  if (hasFolderRoot()) {
    showRecentFilesModal();
  }
});

// Settings Modal
// Get settings modal DOM elements
const $settingsModal = document.getElementById("settings-modal") as HTMLDivElement;
const $settingsCloseBtn = document.getElementById("settings-close-btn") as HTMLButtonElement;
const $settingsSaveBtn = document.getElementById("settings-save-btn") as HTMLButtonElement;
const $settingsResetBtn = document.getElementById("settings-reset-btn") as HTMLButtonElement;
const $settingTheme = document.getElementById("setting-theme") as HTMLSelectElement;
const $settingFontFamily = document.getElementById("setting-font-family") as HTMLSelectElement;
const $settingFontSize = document.getElementById("setting-font-size") as HTMLInputElement;
const $settingFontSizeValue = document.getElementById("setting-font-size-value") as HTMLSpanElement;
const $settingAutosaveEnabled = document.getElementById("setting-autosave-enabled") as HTMLInputElement;
const $settingAutosaveInterval = document.getElementById("setting-autosave-interval") as HTMLInputElement;
const $settingAutosaveIntervalValue = document.getElementById("setting-autosave-interval-value") as HTMLSpanElement;

// Current settings (will be loaded from main process)
let currentSettings: typeof DEFAULT_SETTINGS = { ...DEFAULT_SETTINGS };

// Load settings from main process
async function loadSettingsFromMain(): Promise<void> {
  try {
    const settings = await window.electronAPI.settings.get();
    currentSettings = settings;
    
    // Update UI to reflect loaded settings
    $settingTheme.value = settings.theme;
    $settingFontFamily.value = settings.fontFamily;
    $settingFontSize.value = settings.fontSize.toString();
    $settingFontSizeValue.textContent = settings.fontSize.toString();
    $settingAutosaveEnabled.checked = settings.autosaveEnabled;
    $settingAutosaveInterval.value = (settings.autosaveInterval / 1000).toString();
    $settingAutosaveIntervalValue.textContent = (settings.autosaveInterval / 1000).toString();
    
    // Apply settings
    applySettingsToUI(settings);
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

// Apply settings to UI
function applySettingsToUI(settings: typeof DEFAULT_SETTINGS): void {
  const root = document.documentElement;

  // Apply theme
  if (settings.theme === "auto") {
    // Use system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.style.setProperty("--theme", prefersDark ? "dark" : "light");
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${prefersDark ? "dark" : "light"}`);
  } else {
    root.style.setProperty("--theme", settings.theme);
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${settings.theme}`);
  }

  // Apply font family
  root.style.setProperty("--font-mono", settings.fontFamily);
  console.log("Font family set to:", settings.fontFamily);

  // Apply font size
  root.style.setProperty("--font-size", `${settings.fontSize}px`);
  console.log("Font size set to:", settings.fontSize, "px");
}

// Show settings modal
function showSettingsModal(): void {
  // Load current settings before showing
  loadSettingsFromMain();
  $settingsModal.style.display = "flex";
}

// Hide settings modal
function hideSettingsModal(): void {
  $settingsModal.style.display = "none";
}

// Save settings
async function saveSettings(): Promise<void> {
  const settings: typeof DEFAULT_SETTINGS = {
    theme: $settingTheme.value as typeof DEFAULT_SETTINGS.theme,
    fontFamily: $settingFontFamily.value,
    fontSize: parseInt($settingFontSize.value, 10),
    autosaveEnabled: $settingAutosaveEnabled.checked,
    autosaveInterval: parseInt($settingAutosaveInterval.value, 10) * 1000,
  };
  
  try {
    await window.electronAPI.settings.save(settings);
    applySettingsToUI(settings);
    
    // Update autosave if it changed
    if (settings.autosaveEnabled) {
      autosaveModule.enable(settings.autosaveInterval);
    } else {
      autosaveModule.disable();
    }
    
    hideSettingsModal();
    console.log("Settings saved");
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

// Reset settings to defaults
async function resetSettings(): Promise<void> {
  const defaultSettings: typeof DEFAULT_SETTINGS = {
    theme: "light",
    fontFamily: "monospace",
    fontSize: 14,
    autosaveEnabled: true,
    autosaveInterval: 30000,
  };
  
  // Update UI
  $settingTheme.value = defaultSettings.theme;
  $settingFontFamily.value = defaultSettings.fontFamily;
  $settingFontSize.value = defaultSettings.fontSize.toString();
  $settingFontSizeValue.textContent = defaultSettings.fontSize.toString();
  $settingAutosaveEnabled.checked = defaultSettings.autosaveEnabled;
  $settingAutosaveInterval.value = (defaultSettings.autosaveInterval / 1000).toString();
  $settingAutosaveIntervalValue.textContent = (defaultSettings.autosaveInterval / 1000).toString();
  
  // Save to disk
  try {
    await window.electronAPI.settings.save(defaultSettings);
    applySettingsToUI(defaultSettings);
    
    // Update autosave
    autosaveModule.enable(defaultSettings.autosaveInterval);
    
    console.log("Settings reset to defaults");
  } catch (error) {
    console.error("Failed to reset settings:", error);
  }
}

// Settings modal event listeners
$settingsCloseBtn.addEventListener("click", hideSettingsModal);
$settingsSaveBtn.addEventListener("click", saveSettings);
$settingsResetBtn.addEventListener("click", resetSettings);

// Update font size value display
$settingFontSize.addEventListener("input", () => {
  $settingFontSizeValue.textContent = $settingFontSize.value;
});

// Update autosave interval value display
$settingAutosaveInterval.addEventListener("input", () => {
  $settingAutosaveIntervalValue.textContent = $settingAutosaveInterval.value;
});

// Listen for open-settings command from menu or shortcut
ipcOn("open-settings", () => {
  showSettingsModal();
});

// Close settings modal when clicking outside
$settingsModal.addEventListener("click", (event) => {
  if (event.target === $settingsModal) {
    hideSettingsModal();
  }
});

// Close settings modal on Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $settingsModal.style.display === "flex") {
    hideSettingsModal();
  }
});

// Keyboard Shortcuts Modal
const $keyboardShortcutsModal = document.getElementById("keyboard-shortcuts-modal") as HTMLDivElement;
const $keyboardShortcutsCloseBtn = document.getElementById("keyboard-shortcuts-close-btn") as HTMLButtonElement;

function showKeyboardShortcutsModal(): void {
  $keyboardShortcutsModal.style.display = "flex";
}

function hideKeyboardShortcutsModal(): void {
  $keyboardShortcutsModal.style.display = "none";
}

$keyboardShortcutsCloseBtn.addEventListener("click", hideKeyboardShortcutsModal);

$keyboardShortcutsModal.addEventListener("click", (event) => {
  if (event.target === $keyboardShortcutsModal) {
    hideKeyboardShortcutsModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $keyboardShortcutsModal.style.display === "flex") {
    hideKeyboardShortcutsModal();
  }
});

ipcOn("show-keyboard-shortcuts", () => {
  showKeyboardShortcutsModal();
});

// Initialize
console.log("Renderer process initialized");
updateModeIndicator(); // Initialize mode indicator

// Load settings on startup
loadSettingsFromMain();

// Show mode indicator on main div hover (CSS handles this)
ipcSend("open-recent");
