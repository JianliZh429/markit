/**
 * Configuration System
 * Manages user preferences and application settings
 */

import { app } from "electron";
import * as fs from "fs-extra";
import * as path from "path";
import { logger } from "./utils/logger";

export interface AppConfig {
  // Editor preferences
  theme: "light" | "dark" | "auto";
  fontSize: number;
  fontFamily: string;

  // Autosave settings
  autosaveEnabled: boolean;
  autosaveInterval: number; // in milliseconds

  // File management
  recentFilesLimit: number;

  // Search settings
  searchCaseSensitive: boolean;
  searchWholeWord: boolean;

  // UI preferences
  showLineNumbers: boolean;
  wordWrap: boolean;

  // Performance
  renderCache: boolean;
  searchCache: boolean;

  // Logging
  logLevel: "debug" | "info" | "warn" | "error";
}

const DEFAULT_CONFIG: AppConfig = {
  theme: "auto",
  fontSize: 14,
  fontFamily: "monospace",
  autosaveEnabled: true,
  autosaveInterval: 30000, // 30 seconds
  recentFilesLimit: 10,
  searchCaseSensitive: false,
  searchWholeWord: false,
  showLineNumbers: false,
  wordWrap: true,
  renderCache: true,
  searchCache: true,
  logLevel: "info",
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private configPath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    const userDataPath = app.getPath("userData");
    this.configPath = path.join(userDataPath, "config.json");
    this.config = { ...DEFAULT_CONFIG };
    this.load();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from disk
   */
  private load(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf-8");
        const loadedConfig = JSON.parse(data);

        // Merge with defaults to handle new config keys
        this.config = { ...DEFAULT_CONFIG, ...loadedConfig };

        logger.info("CONFIG", "Configuration loaded successfully");
      } else {
        logger.info("CONFIG", "No config file found, using defaults");
        this.save(); // Create default config file
      }
    } catch (error) {
      logger.error("CONFIG", "Failed to load configuration", error);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save configuration to disk (debounced)
   */
  private save(): void {
    // Debounce saves to avoid excessive disk writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      try {
        const data = JSON.stringify(this.config, null, 2);
        fs.writeFileSync(this.configPath, data, "utf-8");
        logger.info("CONFIG", "Configuration saved successfully");
      } catch (error) {
        logger.error("CONFIG", "Failed to save configuration", error);
      }
      this.saveTimeout = null;
    }, 1000);
  }

  /**
   * Get entire configuration
   */
  getConfig(): Readonly<AppConfig> {
    return { ...this.config };
  }

  /**
   * Get specific config value
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  /**
   * Set specific config value
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.save();
    logger.debug("CONFIG", `Updated ${key}:`, value);
  }

  /**
   * Update multiple config values
   */
  update(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.save();
    logger.debug("CONFIG", "Updated configuration", updates);
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.save();
    logger.info("CONFIG", "Configuration reset to defaults");
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
