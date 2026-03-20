/**
 * Settings Module
 * Manages user preferences stored in a JSON config file
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Settings config file path
const SETTINGS_DIR = path.join(os.homedir(), ".markit");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "config.json");

// Default settings
const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  fontSize: 14,
  fontFamily: "monospace",
  autosaveEnabled: true,
  autosaveInterval: 30000,
};

export interface Settings {
  theme: "light" | "dark" | "auto";
  fontSize: number;
  fontFamily: string;
  autosaveEnabled: boolean;
  autosaveInterval: number;
}

/**
 * Load settings from config file
 */
export function loadSettings(): Settings {
  try {
    // Ensure settings directory exists
    if (!fs.existsSync(SETTINGS_DIR)) {
      fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    }

    // Read config file if it exists
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      const config = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...config };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Save settings to config file
 */
export function saveSettings(settings: Settings): void {
  try {
    // Ensure settings directory exists
    if (!fs.existsSync(SETTINGS_DIR)) {
      fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    }

    // Write config file
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

/**
 * Update specific settings while preserving existing values
 */
export function updateSettings(partial: Partial<Settings>): void {
  const current = loadSettings();
  const updated = { ...current, ...partial };
  saveSettings(updated);
}

/**
 * Get settings directory path
 */
export function getSettingsDir(): string {
  return SETTINGS_DIR;
}
