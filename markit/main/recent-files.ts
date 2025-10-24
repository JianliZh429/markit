import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import * as fsSync from "fs";

const recentFilesPath = path.join(app.getPath("userData"), "recent-files.json");

// Load recent files from JSON (async version)
export async function loadAsync(): Promise<string[]> {
  try {
    const data = await fs.readFile(recentFilesPath, "utf-8");
    return JSON.parse(data) as string[];
  } catch (_error: unknown) {
    return [];
  }
}

// Load recent files from JSON (sync version for backward compatibility)
export function load(): string[] {
  try {
    const data = fsSync.readFileSync(recentFilesPath, "utf-8");
    return JSON.parse(data) as string[];
  } catch (_error: unknown) {
    return [];
  }
}

// Save recent files to JSON (async)
async function save(recentFiles: string[]): Promise<void> {
  await fs.writeFile(recentFilesPath, JSON.stringify(recentFiles, null, 2));
}

// Add a file to the recent files list (async)
export async function addAsync(filePath: string): Promise<void> {
  const recentFiles = await loadAsync();
  const index = recentFiles.indexOf(filePath);
  if (index !== -1) {
    recentFiles.splice(index, 1);
  }
  recentFiles.unshift(filePath);
  if (recentFiles.length > 10) {
    recentFiles.pop();
  }
  await save(recentFiles);
}

// Add a file to the recent files list (sync version for backward compatibility)
export function add(filePath: string): void {
  const recentFiles = load();
  const index = recentFiles.indexOf(filePath);
  if (index !== -1) {
    recentFiles.splice(index, 1);
  }
  recentFiles.unshift(filePath);
  if (recentFiles.length > 10) {
    recentFiles.pop();
  }
  // Use sync write to maintain backward compatibility
  fsSync.writeFileSync(recentFilesPath, JSON.stringify(recentFiles, null, 2));
}
