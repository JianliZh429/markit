/**
 * Shortcuts Orchestrator
 * Handles keyboard shortcuts modal and global keybindings
 */

// Get DOM elements
const $keyboardShortcutsModal = document.getElementById("keyboard-shortcuts-modal") as HTMLDivElement;
const $keyboardShortcutsCloseBtn = document.getElementById("keyboard-shortcuts-close-btn") as HTMLButtonElement;

// Show keyboard shortcuts modal
export function showKeyboardShortcutsModal(): void {
  $keyboardShortcutsModal.style.display = "flex";
}

// Hide keyboard shortcuts modal
export function hideKeyboardShortcutsModal(): void {
  $keyboardShortcutsModal.style.display = "none";
}

// Set up event listeners
export function initShortcuts(): void {
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
}
