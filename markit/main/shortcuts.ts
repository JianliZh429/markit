import { globalShortcut, BrowserWindow } from "electron";

/**
 * Keyboard Shortcuts Manager
 * Registers and manages global keyboard shortcuts
 */

export class ShortcutsManager {
  private win: BrowserWindow;
  private registeredShortcuts: Set<string> = new Set();

  constructor(win: BrowserWindow) {
    this.win = win;
  }

  /**
   * Register all application shortcuts
   */
  registerAll(): void {
    // Toggle Edit/Preview Mode
    this.register("CommandOrControl+/", () => {
      this.win.webContents.send("toggle-mode");
    });

    // Save file
    this.register("CommandOrControl+S", () => {
      this.win.webContents.send("save-opened-file");
    });

    // Toggle file explorer
    this.register("CommandOrControl+B", () => {
      this.win.webContents.send("toggle-explorer");
    });

    // Find in file
    this.register("CommandOrControl+F", () => {
      this.win.webContents.send("local-search");
    });

    // Global search
    this.register("CommandOrControl+Shift+F", () => {
      this.win.webContents.send("global-search");
    });

    console.log(
      `Registered ${this.registeredShortcuts.size} keyboard shortcuts`,
    );
  }

  /**
   * Register a single shortcut
   */
  private register(accelerator: string, callback: () => void): void {
    try {
      const success = globalShortcut.register(accelerator, callback);
      if (success) {
        this.registeredShortcuts.add(accelerator);
        console.log(`Registered shortcut: ${accelerator}`);
      } else {
        console.warn(`Failed to register shortcut: ${accelerator}`);
      }
    } catch (error) {
      console.error(`Error registering shortcut ${accelerator}:`, error);
    }
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
    console.log("Unregistered all shortcuts");
  }

  /**
   * Check if a shortcut is registered
   */
  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Get all registered shortcuts
   */
  getRegistered(): string[] {
    return Array.from(this.registeredShortcuts);
  }
}

// Legacy export for compatibility
export function register(
  _shortcut: typeof globalShortcut,
  win: BrowserWindow,
): void {
  const manager = new ShortcutsManager(win);
  manager.registerAll();
}
