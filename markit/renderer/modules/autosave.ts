/**
 * Autosave Module
 * Handles automatic saving of file content
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Autosave Module
 * Handles automatic saving of file content.
 *
 * Improvements:
 *  - Saves a backup copy to a hidden autosave folder (`$HOME/.markit/autosave`).
 *  - Ensures the autosave directory exists.
 *  - Uses a timestamped filename for each autosave.
 *  - On enable, loads the most recent autosave if no file is currently open.
 */
import { stateManager } from "../state";
import { FileService } from "../services/fileService";

export class AutosaveModule {
  private fileService: FileService;
  private intervalId: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private saveInterval: number = 30000; // 30 seconds default
  private isDirty: boolean = false;
  private statusElement: HTMLElement | null = null;
  private getContentCallback: () => string;

  // Hidden autosave folder (e.g. $HOME/.markit/autosave)
  private readonly AUTOSAVE_DIR: string = path.join(os.homedir(), ".markit", "autosave");

  constructor(
    fileService: FileService,
    getContentCallback: () => string,
    statusElement?: HTMLElement,
  ) {
    this.fileService = fileService;
    this.getContentCallback = getContentCallback;
    this.statusElement = statusElement || null;
    this.setupStateListener();
  }

  private setupStateListener(): void {
    // Listen for content changes to mark as dirty
    stateManager.subscribe((state) => {
      // Mark as dirty when current file exists
      if (state.currentFilePath) {
        this.isDirty = true;
      }
    });
  }


  /**
   * Enable autosave
   */
  enable(interval?: number): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    if (interval) {
      this.saveInterval = interval;
    }

    this.start();
    this.updateStatus("Autosave enabled");
    console.log(`Autosave enabled with ${this.saveInterval}ms interval`);
  }

  /**
   * Disable autosave
   */
  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    this.stop();
    this.updateStatus("Autosave disabled");
    console.log("Autosave disabled");
  }

  /**
   * Toggle autosave on/off
   */
  toggle(): boolean {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.isEnabled;
  }

  /**
   * Set autosave interval
   */
  setInterval(interval: number): void {
    this.saveInterval = interval;
    if (this.isEnabled) {
      // Restart with new interval
      this.stop();
      this.start();
    }
  }

  /**
   * Start autosave timer
   */
  private start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.performAutosave();
    }, this.saveInterval);
  }

  /**
   * Stop autosave timer
   */
  private stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Perform autosave operation
   */
  private async performAutosave(): Promise<void> {
    if (!this.isEnabled) return;
    if (!this.isDirty) return;

    const currentFilePath = stateManager.get("currentFilePath");
    // Ensure autosave directory exists
    try {
      fs.mkdirSync(this.AUTOSAVE_DIR, { recursive: true });
    } catch (e) {
      console.error("Failed to create autosave directory", e);
    }
    const timestamp = Date.now();
    const autosavePath = path.join(this.AUTOSAVE_DIR, `${timestamp}.md`);

    try {
      this.updateStatus("Saving...", "saving");

      const content = this.getContentCallback();

      // Save to actual file if one is open
      if (currentFilePath) {
        await this.fileService.saveFile(currentFilePath, content);
      }

      // Always write hidden backup
      await fs.promises.writeFile(autosavePath, content, "utf-8");

      this.isDirty = false;
      this.updateStatus("Saved", "success");

      setTimeout(() => {
        if (this.statusElement && this.statusElement.textContent === "Saved") {
          this.updateStatus("");
        }
      }, 2000);

      console.log("Autosave completed. Backup saved at", autosavePath);
    } catch (error) {
      console.error("Autosave failed:", error);
      this.updateStatus("Autosave failed", "error");

      setTimeout(() => {
        if (
          this.statusElement &&
          this.statusElement.textContent === "Autosave failed"
        ) {
          this.updateStatus("");
        }
      }, 3000);
    }
  }

  /**
   * Manually trigger autosave
   */
  async saveNow(): Promise<void> {
    await this.performAutosave();
  }

  /**
   * Mark content as dirty (needs saving)
   */
  markDirty(): void {
    this.isDirty = true;
  }

  /**
   * Mark content as clean (saved)
   */
  markClean(): void {
    this.isDirty = false;
  }

  /**
   * Update status display
   */
  private updateStatus(
    message: string,
    status?: "saving" | "success" | "error",
  ): void {
    if (!this.statusElement) return;

    this.statusElement.textContent = message;

    // Remove all status classes
    this.statusElement.classList.remove(
      "status-saving",
      "status-success",
      "status-error",
    );

    // Add appropriate status class
    if (status) {
      this.statusElement.classList.add(`status-${status}`);
    }
  }

  /**
   * Check if autosave is enabled
   */
  isAutosaveEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get current autosave interval
   */
  getInterval(): number {
    return this.saveInterval;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.isEnabled = false;
  }

  /**
   * Get the most recent autosave file path, if any.
   */
   private getLatestAutosaveFile(): string | null {
     try {
       const files = fs.readdirSync(this.AUTOSAVE_DIR);
       const mdFiles = files.filter((f) => f.endsWith('.md'));
       if (mdFiles.length === 0) return null;
       const latest = mdFiles.reduce((a, b) => (parseInt(a) > parseInt(b) ? a : b));
       return path.join(this.AUTOSAVE_DIR, latest);
     } catch (e) {
       console.error('Failed to read autosave directory', e);
       return null;
     }
   }

  /**
   * Load the most recent autosave content.
   * Returns the markdown string or null if none.
   */
   async loadRecentAutosave(): Promise<string | null> {
     const latestPath = this.getLatestAutosaveFile();
     if (!latestPath) return null;
     try {
       const data = await fs.promises.readFile(latestPath, 'utf-8');
       console.log('Loaded autosave from', latestPath);
       return data;
     } catch (e) {
       console.error('Failed to load autosave file', e);
       return null;
     }
   }
}
