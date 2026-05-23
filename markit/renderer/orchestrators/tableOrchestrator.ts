/**
 * Table Orchestrator
 * Handles insert table modal and integration with TableEditorModule
 */

import { EditorModule } from "../modules/editor.js";
import { TableEditorModule } from "../modules/tableEditor.js";

// Get DOM elements
const $insertTableModal = document.getElementById("insert-table-modal") as HTMLDivElement;
const $insertTableCloseBtn = document.getElementById("insert-table-close-btn") as HTMLButtonElement;
const $insertTableCancelBtn = document.getElementById("insert-table-cancel-btn") as HTMLButtonElement;
const $insertTableConfirmBtn = document.getElementById("insert-table-confirm-btn") as HTMLButtonElement;
const $tableRows = document.getElementById("table-rows") as HTMLInputElement;
const $tableColumns = document.getElementById("table-columns") as HTMLInputElement;
const $tableHeader = document.getElementById("table-header") as HTMLInputElement;

// Dependencies
let editorModule: EditorModule | null = null;
let tableEditor: TableEditorModule | null = null;

// Initialize with dependencies
export function initTable(
  _editorModule: EditorModule,
  _tableEditor: TableEditorModule
): void {
  editorModule = _editorModule;
  tableEditor = _tableEditor;
  
  // Set up event listeners
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners(): void {
  $insertTableCloseBtn.addEventListener("click", hideInsertTableModal);
  $insertTableCancelBtn.addEventListener("click", hideInsertTableModal);
  $insertTableConfirmBtn.addEventListener("click", insertTable);

  $insertTableModal.addEventListener("click", (event) => {
    if (event.target === $insertTableModal) {
      hideInsertTableModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $insertTableModal.style.display === "flex") {
      hideInsertTableModal();
    }
  });
}

// Show insert table modal
export function showInsertTableModal(): void {
  $insertTableModal.style.display = "flex";
}

// Hide insert table modal
function hideInsertTableModal(): void {
  $insertTableModal.style.display = "none";
}

// Insert table into editor
function insertTable(): void {
  if (!editorModule || !tableEditor) return;
  
  const rows = parseInt($tableRows.value, 10) || 3;
  const columns = parseInt($tableColumns.value, 10) || 3;
  const headerText = $tableHeader.value || 'Header';

  hideInsertTableModal();

  tableEditor.insertTable({
    rows: Math.min(Math.max(rows, 1), 20),
    columns: Math.min(Math.max(columns, 1), 10),
    headerText
  });
}
