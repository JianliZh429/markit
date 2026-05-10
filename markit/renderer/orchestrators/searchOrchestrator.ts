/**
 * Search Orchestrator
 * Handles local/global search UI wiring (keep searchManager.ts for logic)
 */

import { SearchManager } from "../modules/searchManager.js";
import { stateManager } from "../state.js";

// DOM elements for search
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

// Dependencies
let searchManager: SearchManager;
let editorModule: any; // Will be passed in
let previewModule: any; // Will be passed in
let fileTreeModule: any; // Will be passed in

// Initialize with dependencies
export function initializeSearchOrchestrator(
  _searchManager: SearchManager,
  _editorModule: any,
  _previewModule: any,
  _fileTreeModule: any
): void {
  searchManager = _searchManager;
  editorModule = _editorModule;
  previewModule = _previewModule;
  fileTreeModule = _fileTreeModule;
  
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners(): void {
  // Local search input
  $localSearchInput.addEventListener("keydown", (event) => {
    if (event.code === "Enter") {
      const searchTerm = (event.target as HTMLInputElement).value;
      localSearch(searchTerm);
    }
  });

  // Global search input
  $globalSearchInput.addEventListener("keydown", async (event) => {
    if (event.code === "Enter") {
      const keyword = (event.target as HTMLInputElement).value;
      await globalSearch(keyword);
    }
  });

  // Handle search input
  $localSearchInput.addEventListener("input", () => {
    const searchTerm = $localSearchInput.value;
    const content = currentContent();
    const caseSensitive = $localSearchCaseSensitive.checked;
    const useRegex = $localSearchRegex.checked;
    // Don't auto-select in editor when typing - keep focus on search input
    searchManager.search(content, searchTerm, caseSensitive, useRegex, false);
  });

  // Handle search options change
  $localSearchCaseSensitive.addEventListener("change", () => {
    const searchTerm = $localSearchInput.value;
    const content = currentContent();
    const caseSensitive = $localSearchCaseSensitive.checked;
    const useRegex = $localSearchRegex.checked;
    searchManager.search(content, searchTerm, caseSensitive, useRegex, false);
  });

  $localSearchRegex.addEventListener("change", () => {
    const searchTerm = $localSearchInput.value;
    const content = currentContent();
    const caseSensitive = $localSearchCaseSensitive.checked;
    const useRegex = $localSearchRegex.checked;
    searchManager.search(content, searchTerm, caseSensitive, useRegex, false);
  });

  // Handle Replace button
  $localReplaceBtn.addEventListener("click", () => {
    const replacement = $localReplaceInput.value;
    searchManager.replaceCurrent(replacement);
  });

  // Handle Replace All button
  $localReplaceAllBtn.addEventListener("click", () => {
    const replacement = $localReplaceInput.value;
    const count = searchManager.replaceAll(replacement);
    if (count > 0) {
      // Update editor content in the DOM
      editorModule.setContent(searchManager.getState()?.content || "");
    }
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
        $previewerContainer.style.display = "none";
        $editorContainer.style.display = "none";
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

  // Handle global replace all
  $globalReplaceAllBtn.addEventListener("click", async () => {
    const searchTerm = $globalSearchInput.value;
    const replacement = $globalReplaceInput.value;
    const caseSensitive = $globalSearchCaseSensitive.checked;
    const useRegex = $globalSearchRegex.checked;
    const rootDir = fileTreeModule.getRootDirectory();

    if (!rootDir || !searchTerm) {
      alert("Please open a folder and enter a search term first.");
      return;
    }

    const confirmMsg = `Replace all occurrences of "${searchTerm}" with "${replacement}" in all .md files?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) {
      return;
    }

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
        // Refresh the search to show updated results
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
}

// Helper function to get current content based on mode
function currentContent(): string {
  return stateManager.get("isEditMode")
    ? editorModule.getContent()
    : previewModule.getHtmlContent();
}

// Hide local search panel
function hideLocalSearch(): void {
  $localSearch.style.display = "none";
}

// Hide global search panel
function hideGlobalSearch(): void {
  $globalSearch.style.display = "none";
  $globalSearchResult.style.display = "none";
}

// Check if global search is active
function isGlobalSearchOn(): boolean {
  return (
    $globalSearch.style.display !== "none" ||
    $globalSearchResult.style.display !== "none"
  );
}

// Local search
function localSearch(searchTerm: string): void {
  hideGlobalSearch();
  const content = currentContent();
  const flags = $localSearchCaseSensitive.checked ? "g" : "gi";
  const regex = $localSearchRegex.checked
    ? new RegExp(searchTerm, flags)
    : new RegExp(searchTerm.replace(/[.*+?^${}()|[\\\]]/g, "\\$&"), flags);
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

// Global search
async function globalSearch(keyword: string): Promise<void> {
  hideLocalSearch();
  const rootDir = fileTreeModule.getRootDirectory();
  const results = await (window as any).electronAPI.searchInFiles(rootDir, keyword);
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
        $editorContainer.style.display = "flex";
        $previewerContainer.style.display = "none";
        // This would call the main loadFile function
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
        $editorContainer.style.display = "flex";
        $previewerContainer.style.display = "none";
        // This would call the main loadFile function
        // TODO: Scroll to specific line after file loads
      }
    });
  });

  $globalSearchResult.style.display = "block";
}

// Export functions for IPC handlers
export function handleLocalSearch(): void {
  if ($localSearch.style.display === "none") {
    $localSearch.style.display = "block";
    $localSearchInput.focus();
    
    // Mode-aware search display
    const isEditMode = stateManager.get("isEditMode");
    if (isEditMode) {
      // In Edit mode: keep editor visible, hide search result panel
      // User can navigate with F3/Cmd+G
      $editorContainer.style.display = "flex";
      $previewerContainer.style.display = "none";
      $localSearchResult.style.display = "none";
    } else {
      // In Preview mode: show search results panel
      $editorContainer.style.display = "none";
      $previewerContainer.style.display = "none";
      $localSearchResult.style.display = "block";
      $localSearchResult.innerHTML = currentContent();
    }
    
    hideGlobalSearch();
    $main.classList.add("search-active");  // Hide mode indicator
  } else {
    $localSearch.style.display = "none";
    
    // Restore containers based on mode
    const isEditMode = stateManager.get("isEditMode");
    if (isEditMode) {
      $editorContainer.style.display = "flex";
      $previewerContainer.style.display = "none";
    } else {
      $editorContainer.style.display = "none";
      $previewerContainer.style.display = "flex";
    }
    
    searchManager.clear();
    $main.classList.remove("search-active");  // Show mode indicator
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
    $globalSearchResult.innerHTML = "";  // Clear previous results
    $globalSearchResult.style.display = "none";
    $previewerContainer.style.display = "none";
    $editorContainer.style.display = "none";
    $main.classList.add("search-active");
  }
}