import { BrowserWindow } from "electron";

/**
 * Keyboard Shortcuts Manager
 *
 * NOTE: All keyboard shortcuts are now handled via menu accelerators in menu.ts.
 * Menu accelerators only work when the application window is focused, which prevents
 * Markit from capturing shortcuts when other applications are active.
 *
 * This file is kept for potential future use of truly global shortcuts
 * (shortcuts that should work even when Markit is in the background).
 */

export class ShortcutsManager {
  private win: BrowserWindow;

  constructor(win: BrowserWindow) {
    this.win = win;
  }

  /**
   * Register all application shortcuts
   *
   * Currently empty - all shortcuts are handled via menu accelerators.
   * Menu accelerators are defined in menu.ts and include:
   * - CommandOrControl+S: Save file
   * - CommandOrControl+/: Toggle Edit/Preview mode
   * - CommandOrControl+E: Toggle file explorer
   * - CommandOrControl+F: Find in file
   * - Alt+CommandOrControl+F: Find in files
   */
  registerAll(): void {
    // All shortcuts are now handled via menu accelerators in menu.ts
    // This prevents capturing shortcuts from other applications
    console.log("Keyboard shortcuts handled via menu accelerators");
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll(): void {
    // No global shortcuts to unregister
    console.log("No global shortcuts to unregister");
  }
}

// Legacy export for compatibility
export function register(_shortcut: any, win: BrowserWindow): void {
  const manager = new ShortcutsManager(win);
  manager.registerAll();
}
