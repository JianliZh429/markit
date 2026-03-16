/**
 * Main Renderer Process Entry Point (Refactored)
 * Initializes and coordinates all renderer modules
 */

import { stateManager } from "./state.js";
import { FileService } from "./services/fileService.js";
import { MarkdownService } from "./services/markdownService.js";
import { EditorModule } from "./modules/editor.js";
import { PreviewModule } from "./modules/preview.js";
import { FileTreeModule } from "./modules/fileTree.js";
import { AutosaveModule } from "./modules/autosave.js";

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
  autosaveEnabled: true,
  autosaveInterval: 30000,
};

// Apply default settings to UI
function applySettingsToUI(settings: typeof DEFAULT_SETTINGS): void {
  const root = document.documentElement;
  root.style.setProperty("--theme", settings.theme);
  root.style.setProperty("--font-size", `${settings.fontSize}px`);
  
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(`theme-${settings.theme}`);
}

applySettingsToUI(DEFAULT_SETTINGS);

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

// Initialize modules
const editorModule = new EditorModule($editor, markdownService);
const previewModule = new PreviewModule($previewer, markdownService);

// Initialize autosave module - always uses editor content
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
 * Switch to preview mode
 * Preview mode is READ-ONLY for viewing rendered markdown
 * All editing must be done in editor mode
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

    if (!stateManager.get("isEditMode")) {
      previewMode();
    }

    $title.textContent = filePath;
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

  $globalSearchResult.innerHTML = results
    .map(
      (result: any) => `
        <div>
          <h3>${result.file}</h3>
          ${result.matches.map((match: any) => `<p>...${match.snippet}...</p>`).join("")}
        </div>
      `,
    )
    .join("");
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
ipcOn("toggle-mode", async () => {
  const isEditMode = stateManager.get("isEditMode");
  stateManager.set("isEditMode", !isEditMode);
  $localSearch.style.display = "none";

  if (stateManager.get("isEditMode")) {
    await editMode();
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

ipcOn("local-search", () => {
  if ($localSearch.style.display === "none") {
    $localSearch.style.display = "block";
    $localSearchInput.focus();
    $localSearchResult.innerHTML = currentContent();
    $previewer.style.display = "none";
    $editor.style.display = "none";
    hideGlobalSearch();
  } else {
    $localSearch.style.display = "none";
    $previewer.style.display = "block";
    $editor.style.display = "none";
  }
});

ipcOn("global-search", () => {
  if (isGlobalSearchOn()) {
    hideGlobalSearch();
    $previewer.style.display = "block";
    $editor.style.display = "none";
  } else {
    $globalSearch.style.display = "block";
    $globalSearchInput.focus();
    $globalSearchResult.innerHTML = currentContent();
    $previewer.style.display = "none";
    $editor.style.display = "none";
  }
});

// Initialize
console.log("Renderer process initialized");
ipcSend("open-recent-file");
