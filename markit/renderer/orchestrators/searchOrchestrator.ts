/**
 * Search Orchestrator
 * Handles local/global search UI wiring (keeps searchManager.ts for logic)
 * 
 * Extracted from renderer.ts (originally ~200 lines of search-related code)
 */

import { SearchManager } from "../modules/searchManager.js";
import { stateManager } from "../state.js";

// DOM elements
const $localSearch = document.getElementById("local-search") as HTMLDivElement;
const $localSearchInput = document.getElementById("local-search-input") as HTMLInputElement;
const $localSearchResult = document.getElementById("local-search-result") as HTMLDivElement;
const $globalSearch = document.getElementById("global-search") as HTMLDivElement;
const $globalSearchInput = document.getElementById("global-search-input") as HTMLInputElement;
const $globalSearchResult = document.getElementById("global-search-result") as HTMLDivElement;
const $main = document.getElementById("main") as HTMLDivElement;
const $editorContainer = document.getElementById("editor-container") as HTMLDivElement;
const $previewerContainer = document.getElementById("previewer-container") as HTMLDivElement;

// Search options
const $localSearchCaseSensitive = document.getElementById("local-search-case-sensitive") as HTMLInputElement;
const $localSearchRegex = document.getElementById("local-search-regex") as HTMLInputElement;
const $localReplaceInput = document.getElementById("local-replace-input") as HTMLInputElement;
const $localReplaceBtn = document.getElementById("local-replace-btn") as HTMLButtonElement;
const $localReplaceAllBtn = document.getElementById("local-replace-all-btn") as HTMLButtonElement;

// Global search options
const $globalSearchCaseSensitive = document.getElementById("global-search-case-sensitive") as HTMLInputElement;
const $globalSearchRegex = document.getElementById("global-search-regex") as HTMLInputElement;
const $globalReplaceInput = document.getElementById("global-replace-input") as HTMLInputElement;
const $globalReplaceAllBtn = document.getElementById("global-replace-all-btn") as HTMLButtonElement;

// Dependencies (injected via init)
let searchManager: SearchManager | null = null;
let editorModule: any = null;
let previewModule: any = null;
let fileTreeModule: any = null;
let ipcImage: any = null;
let loadFileFn: ((filePath: string) => Promise<void>) | null = null;

// Initialize with dependencies
export function initSearch(
  _searchManager: SearchManager,
  _editorModule: any,
  _previewModule: any,
  _fileTreeModule: any,
  _ipcImage: any,
  _loadFileFn: (filePath: string) => Promise<void>
): void {
  searchManager = _searchManager;
  editorModule = _editorModule;
  previewModule = _previewModule;
  fileTreeModule = _fileTreeModule;
  ipcImage = _ipcImage;
  loadFileFn = _loadFileFn;
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners(): void {
  // Local search input enter key
  $localSearchInput.addEventListener("keydown", (event) => {
    if (event.code === "Enter") {
      const searchTerm = (event.target as HTMLInputElement).value;
      localSearch(searchTerm);
    }
  });

  // Global search input enter key
  $globalSearchInput.addEventListener("keydown", async (event) => {
    if (event.code === "Enter") {
      const keyword = (event.target as HTMLInputElement).value;
      await globalSearch(keyword);
    }
  });

  // Handle search input change
  $localSearchInput.addEventListener("input", () => {
    const searchTerm = $localSearchInput.value;
    const content = currentContent();
    const caseSensitive = $localSearchCaseSensitive.checked;
    const useRegex = $localSearchRegex.checked;
    searchManager?.search(content, searchTerm, caseSensitive, useRegex, false);
  });

  // Handle search option changes
  $localSearchCaseSensitive.addEventListener("change", () => {
    const searchTerm = $localSearchInput.value;
    const content = currentContent();
    const caseSensitive = $localSearchCaseSensitive.checked;
    const useRegex = $localSearchRegex.checked;
    searchManager?.search(content, searchTerm, caseSensitive, useRegex, false);
  });

  $localSearchRegex.addEventListener("change", () => {
    const searchTerm = $localSearchInput.value;
    const content = currentContent();
    const caseSensitive = $localSearchCaseSensitive.checked;
    const useRegex = $localSearchRegex.checked;
    searchManager?.search(content, searchTerm, caseSensitive, useRegex, false);
  });

  // Handle Replace button
  $localReplaceBtn.addEventListener("click", () => {
    const replacement = $localReplaceInput.value;
    searchManager?.replaceCurrent(replacement);
  });

  // Handle Replace All button
  $localReplaceAllBtn.addEventListener("click", () => {
    const replacement = $localReplaceInput.value;
    const count = searchManager?.replaceAll(replacement) || 0;
    if (count > 0 && editorModule) {
      editorModule.setContent(searchManager!.getState()?.content || "");
    }
  });

  // Find Next/Previous via Enter key
  $localSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!searchManager) return;
      if (event.shiftKey) {
        searchManager.findPrevious();
      } else {
        searchManager.findNext();
      }
    }
  });

  // Global replace all
  $globalReplaceAllBtn.addEventListener("click", async () => {
    const searchTerm = $globalSearchInput.value;
    const replacement = $globalReplaceInput.value;
    const caseSensitive = $globalSearchCaseSensitive.checked;
    const useRegex = $globalSearchRegex.checked;
    const rootDir = fileTreeModule?.getRootDirectory();

    if (!rootDir || !searchTerm) {
      alert("Please open a folder and enter a search term first.");
      return;
    }

    const confirmMsg = `Replace all occurrences of "${searchTerm}" with "${replacement}" in all .md files?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      const results = await (window as any).electronAPI.replaceInFiles(
        rootDir,
        searchTerm,
        replacement,
        "md",
        caseSensitive,
        useRegex,
      ) as { file: string; replacements: number }[];

      if (results.length > 0) {
        const totalReplacements = results.reduce((sum, r) => sum + r.replacements, 0);
        alert(`Replaced ${totalReplacements} occurrences across ${results.length} files.`);
        if (searchTerm) {
          await globalSearch(searchTerm);
        }
      } else {
        alert("No matches found to replace.");
      }
    } catch (error) {
      console.error("Global replace failed:", error);
      alert("Failed to perform replace. Check console for details.");
    }
  });

  // Global shortcut for Find Next/Previous (F3, Cmd+G)
  document.addEventListener("keydown", (event) => {
    // F3 for Find Next/Previous
    if (event.key === "F3") {
      event.preventDefault();
      if (searchManager?.hasActiveSearch()) {
        if (event.shiftKey) {
          searchManager.findPrevious();
        } else {
          searchManager.findNext();
        }
      } else {
        handleLocalSearch();
        $localSearchInput.focus();
        $previewerContainer.style.display = "none";
        $editorContainer.style.display = "none";
        $main.classList.add("search-active");
      }
    }

    // Cmd+G / Ctrl+G for Find Next/Previous
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "g") {
      event.preventDefault();
      if (searchManager?.hasActiveSearch()) {
        if (event.shiftKey) {
          searchManager.findPrevious();
        } else {
          searchManager.findNext();
        }
      }
    }
  });
}

// Helper functions
function currentContent(): string {
  return stateManager.get("isEditMode")
    ? editorModule?.getContent()
    : previewModule?.getHtmlContent()
    || "";
}

function hideLocalSearch(): void {
  $localSearch.style.display = "none";
}

function hideGlobalSearch(): void {
  $globalSearch.style.display = "none";
  $globalSearchResult.style.display = "none";
}

function isGlobalSearchOn(): boolean {
  return (
    $globalSearch.style.display !== "none" ||
    $globalSearchResult.style.display !== "none"
  );
}

function localSearch(searchTerm: string): void {
  hideGlobalSearch();
  const content = currentContent();
  const flags = $localSearchCaseSensitive.checked ? "g" : "gi";
  const regex = $localSearchRegex.checked
    ? new RegExp(searchTerm, flags)
    : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
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

async function globalSearch(keyword: string): Promise<void> {
  hideLocalSearch();
  const rootDir = fileTreeModule?.getRootDirectory();
  const results = await (window as any).electronAPI.searchInFiles(rootDir, keyword);
  console.log("Search results:", results);

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

  // Add click handlers for expand/collapse
  $globalSearchResult.querySelectorAll(".search-file-header").forEach((header) => {
    header.addEventListener("click", () => {
      const group = header.parentElement as HTMLElement;
      const matches = group.querySelector(".search-file-matches") as HTMLElement;
      matches.classList.toggle("expanded");
      header.classList.toggle("expanded");
    });

    // Double-click to open file
    header.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const filePath = (header.parentElement as HTMLElement)?.dataset.file;
      if (filePath && loadFileFn) {
        hideGlobalSearch();
        $editorContainer.style.display = "flex";
        $previewerContainer.style.display = "none";
        loadFileFn(filePath);
      }
    });
  });

  // Add click handlers for match items
  $globalSearchResult.querySelectorAll(".search-match-item").forEach((item) => {
    item.addEventListener("dblclick", () => {
      const group = item.closest(".search-file-group") as HTMLElement;
      const filePath = group?.dataset.file;
      if (filePath && loadFileFn) {
        hideGlobalSearch();
        $editorContainer.style.display = "flex";
        $previewerContainer.style.display = "none";
        loadFileFn(filePath);
      }
    });
  });

  $globalSearchResult.style.display = "block";
}

// Exported IPC handler functions
export function handleLocalSearch(): void {
  if ($localSearch.style.display === "none") {
    $localSearch.style.display = "block";
    $localSearchInput.focus();
    
    const isEditMode = stateManager.get("isEditMode");
    if (isEditMode) {
      $editorContainer.style.display = "flex";
      $previewerContainer.style.display = "none";
      $localSearchResult.style.display = "none";
    } else {
      $editorContainer.style.display = "none";
      $previewerContainer.style.display = "none";
      $localSearchResult.style.display = "block";
      $localSearchResult.innerHTML = currentContent();
    }
    
    hideGlobalSearch();
    $main.classList.add("search-active");
  } else {
    $localSearch.style.display = "none";
    
    const isEditMode = stateManager.get("isEditMode");
    if (isEditMode) {
      $editorContainer.style.display = "flex";
      $previewerContainer.style.display = "none";
    } else {
      $editorContainer.style.display = "none";
      $previewerContainer.style.display = "flex";
    }
    
    searchManager?.clear();
    $main.classList.remove("search-active");
  }
}

export function handleGlobalSearch(): void {
  if (isGlobalSearchOn()) {
    hideGlobalSearch();
    $previewerContainer.style.display = "flex";
    $editorContainer.style.display = "flex";
    $main.classList.remove("search-active");
  } else {
    $globalSearch.style.display = "block";
    $globalSearchInput.focus();
    $globalSearchResult.innerHTML = "";
    $globalSearchResult.style.display = "none";
    $previewerContainer.style.display = "none";
    $editorContainer.style.display = "none";
    $main.classList.add("search-active");
  }
}
