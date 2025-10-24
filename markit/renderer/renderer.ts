/**
 * Main Renderer Process Entry Point
 * Initializes and coordinates all renderer modules
 */

import { stateManager } from "./state.js";
import { FileService } from "./services/fileService.js";
import { MarkdownService } from "./services/markdownService.js";
import { EditorModule } from "./modules/editor.js";
import { PreviewModule } from "./modules/preview.js";

// Get electron API from window
const {
  send: ipcSend,
  on: ipcOn,
  fs,
  path,
  searchInFiles,
  parseMarkdown,
  setMarkdownBaseUrl,
} = window.electronAPI;

// Initialize services
const fileService = new FileService(fs, path);
const markdownService = new MarkdownService({ parseMarkdown, setMarkdownBaseUrl });

// Get DOM elements
const $explorer = document.getElementById("explorer") as HTMLDivElement;
const $editor = document.getElementById("editor") as HTMLTextAreaElement;
const $previewer = document.getElementById("previewer") as HTMLDivElement;
const $tree = document.getElementById("tree") as HTMLUListElement;
const $title = document.querySelector("title") as HTMLTitleElement;
const $localSearch = document.getElementById("local-search") as HTMLDivElement;
const $localSearchInput = document.getElementById("local-search-input") as HTMLInputElement;
const $localSearchResult = document.getElementById("local-search-result") as HTMLDivElement;
const $globalSearch = document.getElementById("global-search") as HTMLDivElement;
const $globalSearchInput = document.getElementById("global-search-input") as HTMLInputElement;
const $globalSearchResult = document.getElementById("global-search-result") as HTMLDivElement;

// Initialize modules
const editorModule = new EditorModule($editor, markdownService);
const previewModule = new PreviewModule($previewer, markdownService);

// Track selected file element
let $selected: HTMLLIElement | null = null;

/**
 * Get root directory path from tree
 */
function rootDirectory(): string {
  return ($tree.firstElementChild as HTMLLIElement)?.dataset.fullPath || "";
}

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
 */
function previewMode(): void {
  const markdownContent = editorModule.getContent();
  previewModule.setMarkdownContent(markdownContent);
  
  editorModule.hide();
  previewModule.show(true); // Make editable
  
  stateManager.set("isEditMode", false);
}

/**
 * Switch to edit mode
 */
function editMode(): void {
  // Get plain text from preview (in case user edited it)
  const plainText = $previewer.innerText || $previewer.textContent || "";
  editorModule.setContent(plainText);
  
  previewModule.hide();
  editorModule.show();
  
  stateManager.set("isEditMode", true);
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
 * Switch folder open/closed state
 */
function switchFolderState($li: HTMLLIElement): void {
  if ($li.classList.contains("folder-open")) {
    $li.classList.remove("folder-open");
    $li.classList.add("folder");
  } else {
    $li.classList.remove("folder");
    $li.classList.add("folder-open");
  }
}

/**
 * Change selected file in tree
 */
function changeSelected($target: HTMLLIElement): void {
  if ($selected) {
    $selected.classList.remove("selected");
  }
  $target.classList.add("selected");
  $selected = $target;
}

/**
 * Get or create child ul element
 */
function getOrCreateChildUl($li: HTMLLIElement): HTMLUListElement {
  let $ul = $li.getElementsByTagName("ul")[0];
  if ($ul) {
    return $ul;
  }
  $ul = document.createElement("ul");
  $li.appendChild($ul);
  return $ul;
}

/**
 * File double-click listener
 */
function fileDblClickListener(event: Event): void {
  const $li = event.target as HTMLLIElement;
  const filePath = $li.dataset.fullPath!;
  hideLocalSearch();
  hideGlobalSearch();
  changeSelected($li);
  loadFile(filePath);
  event.stopPropagation();
}

/**
 * Folder double-click listener
 */
function folderDblClickListener(event: Event): void {
  const $li = event.target as HTMLLIElement;
  const filePath = $li.dataset.fullPath!;
  switchFolderState($li);
  const $ul = $li.getElementsByTagName("ul")[0];
  if ($ul) {
    $li.removeChild($ul);
  } else {
    unfoldDir($li, filePath);
  }
  event.stopPropagation();
}

/**
 * Append a node to the tree
 */
function appendNode($ul: HTMLUListElement, filePath: string, isFile: boolean): HTMLLIElement {
  const parsedPath = fileService.parsePath(filePath);
  const $li = document.createElement("li");
  $li.appendChild(document.createTextNode(parsedPath.base));
  $li.dataset.fullPath = filePath;
  $ul.appendChild($li);

  if (isFile) {
    $li.classList.add("file");
    $li.addEventListener("dblclick", fileDblClickListener);
  } else {
    $li.classList.add("folder");
    $li.addEventListener("dblclick", folderDblClickListener);
  }
  return $li;
}

/**
 * Unfold a directory
 */
function unfoldDir($li: HTMLLIElement, filePath: string): void {
  const $ul = getOrCreateChildUl($li);
  const files = fileService.listDirectory(filePath);
  
  files.forEach((fPath) => {
    const parsedPath = fileService.parsePath(fPath);
    if (fileService.isDirectory(fPath)) {
      appendNode($ul, fPath, false);
    } else if (parsedPath.ext.toLowerCase() === ".md") {
      appendNode($ul, fPath, true);
    }
  });
}

/**
 * Show file tree
 */
function showFileTree($root: HTMLUListElement, filePath: string): void {
  if (fileService.isDirectory(filePath)) {
    const $parent = appendNode($root, filePath, false);
    unfoldDir($parent, filePath);
    switchFolderState($parent);
  } else {
    appendNode($root, filePath, true);
  }
}

/**
 * Load file or folder to explorer
 */
function loadFileOrFolderToExplorer($tree: HTMLUListElement, filePath: string): void {
  $tree.innerHTML = "";
  if (fileService.isFile(filePath)) {
    loadFile(filePath);
  }
  showFileTree($tree, filePath);
}

/**
 * Create a new file
 */
async function createFile(filePath: string, callback?: (path: string) => void): Promise<void> {
  try {
    await fileService.createFile(filePath);
    if (callback) {
      loadFile(filePath);
    }
    console.log(`File ${filePath} created successfully`);
  } catch (err) {
    console.error("Error creating file:", err);
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
      (match) => `<mark>${match}</mark>`
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
  const results = await searchInFiles(rootDirectory(), keyword);
  console.log("Search results:", results);
  
  $globalSearchResult.innerHTML = results
    .map(
      (result: any) => `
        <div>
          <h3>${result.file}</h3>
          ${result.matches.map((match: any) => `<p>...${match.snippet}...</p>`).join("")}
        </div>
      `
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

  if (activeElement === $localSearchInput || activeElement === $globalSearchInput) {
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
  loadFileOrFolderToExplorer($tree, filePath);
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

ipcOn("new-file-created", (filePath: string) => {
  createFile(filePath, (path) => {
    loadFile(path);
  });
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
