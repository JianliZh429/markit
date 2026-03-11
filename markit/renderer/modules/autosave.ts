/**
 * Autosave Module
 * Handles automatic saving of file content (renderer-side state tracking)
 *
 * Note: Actual file saving is handled by the main process via IPC.
 */

import { stateManager } from "../state";

export class AutosaveModule {
  private intervalId: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private saveInterval: number = 30000; // 30 seconds default
  private isDirty: boolean = false;
  private statusElement: HTMLElement | null = null;
  private getContentCallback: () => string;

  constructor(
    getContentCallback: () => string,
    statusElement?: HTMLElement,
  ) {
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
  private performAutosave(): void {
    if (!this.isEnabled) return;
    if (!this.isDirty) return;

    const currentFilePath = stateManager.get("currentFilePath");
    if (!currentFilePath) {
      console.log("Autosave skipped: no file open");
      return;
    }

    try {
      this.updateStatus("Saving...", "saving");

      const content = this.getContentCallback();
      
      // Send save request to main process
      const { send } = (window as any).electronAPI;
      send("autosave-file", currentFilePath, content);

      this.isDirty = false;
      this.updateStatus("Saved", "success");

      // Clear success message after 2 seconds
      setTimeout(() => {
        if (this.statusElement && this.statusElement.textContent === "Saved") {
          this.updateStatus("");
        }
      }, 2000);

      console.log("Autosave completed:", currentFilePath);
    } catch (error) {
      console.error("Autosave failed:", error);
      this.updateStatus("Autosave failed", "error");

      // Clear error message after 3 seconds
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
    this.performAutosave();
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
}
