/**
 * Settings Orchestrator
 * Handles settings modal, load/save/reset, apply to UI
 */

import { stateManager } from "../state.js";

// Define types for settings
type ThemeType = "light" | "dark" | "auto";
type FontFamilyType = "monospace" | "system-ui" | "georgia" | "arial" | "times-new-roman";

interface Settings {
  theme: ThemeType;
  fontSize: number;
  fontFamily: FontFamilyType;
  autosaveEnabled: boolean;
  autosaveInterval: number;
}

// Default settings (can be overridden by main process via IPC)
const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  fontSize: 14,
  fontFamily: "monospace",
  autosaveEnabled: true,
  autosaveInterval: 30000,
};

// Get DOM elements
const $settingsModal = document.getElementById("settings-modal") as HTMLDivElement;
const $settingsCloseBtn = document.getElementById("settings-close-btn") as HTMLButtonElement;
const $settingsSaveBtn = document.getElementById("settings-save-btn") as HTMLButtonElement;
const $settingsResetBtn = document.getElementById("settings-reset-btn") as HTMLButtonElement;
const $settingTheme = document.getElementById("setting-theme") as HTMLSelectElement;
const $settingFontFamily = document.getElementById("setting-font-family") as HTMLSelectElement;
const $settingFontSize = document.getElementById("setting-font-size") as HTMLInputElement;
const $settingFontSizeValue = document.getElementById("setting-font-size-value") as HTMLSpanElement;
const $settingAutosaveEnabled = document.getElementById("setting-autosave-enabled") as HTMLInputElement;
const $settingAutosaveInterval = document.getElementById("setting-autosave-interval") as HTMLInputElement;
const $settingAutosaveIntervalValue = document.getElementById("setting-autosave-interval-value") as HTMLSpanElement;

// Current settings (will be loaded from main process)
let currentSettings: Settings = { ...DEFAULT_SETTINGS };

// Load settings from main process
async function loadSettingsFromMain(): Promise<void> {
  try {
    const settings = await (window as any).electronAPI.settings.get();
    currentSettings = settings;
    
    // Update UI to reflect loaded settings
    $settingTheme.value = settings.theme;
    $settingFontFamily.value = settings.fontFamily;
    $settingFontSize.value = settings.fontSize.toString();
    $settingFontSizeValue.textContent = settings.fontSize.toString();
    $settingAutosaveEnabled.checked = settings.autosaveEnabled;
    $settingAutosaveInterval.value = (settings.autosaveInterval / 1000).toString();
    $settingAutosaveIntervalValue.textContent = (settings.autosaveInterval / 1000).toString();
    
    // Apply settings
    applySettingsToUI(settings);
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

// Apply settings to UI
function applySettingsToUI(settings: Settings): void {
  const root = document.documentElement;

  // Apply theme
  if (settings.theme === "auto") {
    // Use system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.style.setProperty("--theme", prefersDark ? "dark" : "light");
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${prefersDark ? "dark" : "light"}`);
  } else {
    root.style.setProperty("--theme", settings.theme);
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${settings.theme}`);
  }

  // Apply font family
  root.style.setProperty("--font-mono", settings.fontFamily);
  console.log("Font family set to:", settings.fontFamily);

  // Apply font size
  root.style.setProperty("--font-size", `${settings.fontSize}px`);
  console.log("Font size set to:", settings.fontSize, "px");
}

// Show settings modal
export function showSettingsModal(): void {
  // Load current settings before showing
  loadSettingsFromMain();
  $settingsModal.style.display = "flex";
}

// Hide settings modal
function hideSettingsModal(): void {
  $settingsModal.style.display = "none";
}

// Save settings
async function saveSettings(): Promise<void> {
  const settings: Settings = {
    theme: $settingTheme.value as ThemeType,
    fontFamily: $settingFontFamily.value as FontFamilyType,
    fontSize: parseInt($settingFontSize.value, 10),
    autosaveEnabled: $settingAutosaveEnabled.checked,
    autosaveInterval: parseInt($settingAutosaveInterval.value, 10) * 1000,
  };
  
  try {
    await (window as any).electronAPI.settings.save(settings);
    applySettingsToUI(settings);
    
    hideSettingsModal();
    console.log("Settings saved");
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

// Reset settings to defaults
async function resetSettings(): Promise<void> {
  const defaultSettings: Settings = {
    theme: "light",
    fontFamily: "monospace",
    fontSize: 14,
    autosaveEnabled: true,
    autosaveInterval: 30000,
  };
  
  // Update UI
  $settingTheme.value = defaultSettings.theme;
  $settingFontFamily.value = defaultSettings.fontFamily;
  $settingFontSize.value = defaultSettings.fontSize.toString();
  $settingFontSizeValue.textContent = defaultSettings.fontSize.toString();
  $settingAutosaveEnabled.checked = defaultSettings.autosaveEnabled;
  $settingAutosaveInterval.value = (defaultSettings.autosaveInterval / 1000).toString();
  $settingAutosaveIntervalValue.textContent = (defaultSettings.autosaveInterval / 1000).toString();
  
  // Save to disk
  try {
    await (window as any).electronAPI.settings.save(defaultSettings);
    applySettingsToUI(defaultSettings);
    
    console.log("Settings reset to defaults");
  } catch (error) {
    console.error("Failed to reset settings:", error);
  }
}

// Settings modal event listeners
$settingsCloseBtn.addEventListener("click", hideSettingsModal);
$settingsSaveBtn.addEventListener("click", saveSettings);
$settingsResetBtn.addEventListener("click", resetSettings);

// Update font size value display
$settingFontSize.addEventListener("input", () => {
  $settingFontSizeValue.textContent = $settingFontSize.value;
});

// Update autosave interval value display
$settingAutosaveInterval.addEventListener("input", () => {
  $settingAutosaveIntervalValue.textContent = $settingAutosaveInterval.value;
});

// Close settings modal when clicking outside
$settingsModal.addEventListener("click", (event) => {
  if (event.target === $settingsModal) {
    hideSettingsModal();
  }
});

// Close settings modal on Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $settingsModal.style.display === "flex") {
    hideSettingsModal();
  }
});

// Initialize settings on startup
export async function initializeSettings(): Promise<void> {
  await loadSettingsFromMain();
}