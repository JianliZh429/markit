/**
 * Recent Files Orchestrator
 * Handles Cmd+Tab modal, recent files list, navigation
 */

import { stateManager } from "../state.js";
import { FileTreeModule } from "../modules/fileTree.js";

// Get DOM elements
const $recentFilesModal = document.getElementById("recent-files-modal") as HTMLDivElement;
const $recentFilesList = document.getElementById("recent-files-list") as HTMLUListElement;

// Recent Files Switcher Modal - macOS Style
// Only works when a folder is opened as root in the tree view
let recentFilesList: string[] = [];
let currentRecentFileIndex = 0;
let isModalVisible = false;
let isControlKeyDown = false;
let hasNavigated = false; // Track if user has navigated with Tab

// Dependencies
let fileTreeModule: FileTreeModule;
let loadFileFunction: (filePath: string) => Promise<void>;
let loadFileContentOnlyFunction: (filePath: string) => Promise<void>;

// Initialize with dependencies
export function initializeRecentFilesOrchestrator(
  _fileTreeModule: FileTreeModule,
  _loadFileFunction: (filePath: string) => Promise<void>,
  _loadFileContentOnlyFunction: (filePath: string) => Promise<void>
): void {
  fileTreeModule = _fileTreeModule;
  loadFileFunction = _loadFileFunction;
  loadFileContentOnlyFunction = _loadFileContentOnlyFunction;
  
  // Set up keyboard event listeners for modal navigation
  setupKeyboardNavigation();
}

// Check if we have a valid folder root (recent files only work with folder root)
function hasFolderRoot(): boolean {
  const rootDir = fileTreeModule.getRootDirectory();
  return rootDir !== "" && rootDir !== null && rootDir !== undefined;
}

// Show the recent files modal
export function showRecentFilesModal(): void {
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
export function hideRecentFilesModal(): void {
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
      loadFileContentOnlyFunction(filePath);
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

// Cancel the modal without opening any file
export function cancelRecentFilesModal(): void {
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

  const path = (window as any).electronAPI.path; // Access path module from electronAPI

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
export function navigateNextRecentFile(): void {
  if (recentFilesList.length === 0) return;
  
  // Circular navigation: go to next, wrap around at end
  currentRecentFileIndex = (currentRecentFileIndex + 1) % recentFilesList.length;
  hasNavigated = true;
  renderRecentFilesModal();
}

// Navigate to previous recent file (backward)
export function navigatePreviousRecentFile(): void {
  if (recentFilesList.length === 0) return;
  
  // Circular navigation: go to previous, wrap around at beginning
  currentRecentFileIndex = (currentRecentFileIndex - 1 + recentFilesList.length) % recentFilesList.length;
  hasNavigated = true;
  renderRecentFilesModal();
}

// Set up keyboard navigation for the modal
function setupKeyboardNavigation(): void {
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
}

// Update recent files list when a file is opened
export function addToRecentFiles(filePath: string): void {
  if (!hasFolderRoot()) {
    return;
  }

  // Since we don't have access to the file service here, we'll assume it's a file
  // The main renderer will handle the validation
  const index = recentFilesList.indexOf(filePath);
  if (index !== -1) {
    recentFilesList.splice(index, 1);
  }
  recentFilesList.unshift(filePath);
  if (recentFilesList.length > 10) {
    recentFilesList.pop();
  }
  currentRecentFileIndex = 0;
  console.log(`Added to recent files: ${filePath} (total: ${recentFilesList.length})`);
}

// Get the current recent files list
export function getRecentFiles(): string[] {
  return [...recentFilesList]; // Return a copy to prevent external modifications
}

// Get the current index in the recent files list
export function getCurrentRecentFileIndex(): number {
  return currentRecentFileIndex;
}