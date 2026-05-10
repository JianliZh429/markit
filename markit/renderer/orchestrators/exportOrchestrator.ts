/**
 * Export Orchestrator
 * Handles export modal, HTML export flow
 */

import { EditorModule } from "../modules/editor.js";
import { ExportService } from "../services/exportService.js";

// Get DOM elements
const $exportModal = document.getElementById("export-modal") as HTMLDivElement;
const $exportCloseBtn = document.getElementById("export-close-btn") as HTMLButtonElement;
const $exportCancelBtn = document.getElementById("export-cancel-btn") as HTMLButtonElement;
const $exportConfirmBtn = document.getElementById("export-confirm-btn") as HTMLButtonElement;

// Dependencies
let editorModule: EditorModule;
let exportService: ExportService;

// Initialize with dependencies
export function initializeExportOrchestrator(
  _editorModule: EditorModule,
  _exportService: ExportService
): void {
  editorModule = _editorModule;
  exportService = _exportService;
  
  // Set up event listeners
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners(): void {
  $exportCloseBtn.addEventListener("click", hideExportModal);
  $exportCancelBtn.addEventListener("click", hideExportModal);
  $exportConfirmBtn.addEventListener("click", exportDocument);

  $exportModal.addEventListener("click", (event) => {
    if (event.target === $exportModal) {
      hideExportModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $exportModal.style.display === "flex") {
      hideExportModal();
    }
  });
}

// Show export modal
export function showExportModal(): void {
  $exportModal.style.display = "flex";
}

// Hide export modal
function hideExportModal(): void {
  $exportModal.style.display = "none";
}

// Export document to HTML
async function exportDocument(): Promise<void> {
  const markdown = editorModule.getContent();
  const fullFileName = document.title || 'exported-document';
  
  // Extract just the filename from the full path
  const fileName = fullFileName.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'exported-document';

  hideExportModal();

  // Export to HTML with styled content
  const html = await exportService.exportToHtml(markdown, fileName);

  try {
    const filePath = await (window as any).electronAPI.export.toHtml(html, fileName + '.html');
    if (filePath) {
      console.log('Exported to:', filePath);
    } else {
      // IPC canceled, use download fallback
      exportService.downloadHtml(html, fileName + '.html');
    }
  } catch (error) {
    // IPC failed, use download fallback
    console.log('IPC export failed, using download:', error);
    exportService.downloadHtml(html, fileName + '.html');
  }
}