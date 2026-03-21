import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import * as fsSync from "fs";

const recentOpensPath = path.join(app.getPath("userData"), "recent-opens.json");

// Load recent opens from JSON (async version)
export async function loadAsync(): Promise<string[]> {
  try {
    const data = await fs.readFile(recentOpensPath, "utf-8");
    return JSON.parse(data) as string[];
  } catch (_error: unknown) {
    return [];
  }
}

// Load recent opens from JSON (sync version for backward compatibility)
export function load(): string[] {
  try {
    const data = fsSync.readFileSync(recentOpensPath, "utf-8");
    return JSON.parse(data) as string[];
  } catch (_error: unknown) {
    return [];
  }
}

// Save recent opens to JSON (async)
async function save(recentOpens: string[]): Promise<void> {
  await fs.writeFile(recentOpensPath, JSON.stringify(recentOpens, null, 2));
}

// Add a file/folder to the recent opens list (async)
export async function addAsync(filePath: string): Promise<void> {
  const recentOpens = await loadAsync();
  const index = recentOpens.indexOf(filePath);
  if (index !== -1) {
    recentOpens.splice(index, 1);
  }
  recentOpens.unshift(filePath);
  if (recentOpens.length > 10) {
    recentOpens.pop();
  }
  await save(recentOpens);
}

// Add a file/folder to the recent opens list (sync version for backward compatibility)
export function add(filePath: string): void {
  const recentOpens = load();
  const index = recentOpens.indexOf(filePath);
  if (index !== -1) {
    recentOpens.splice(index, 1);
  }
  recentOpens.unshift(filePath);
  if (recentOpens.length > 10) {
    recentOpens.pop();
  }
  // Use sync write to maintain backward compatibility
  fsSync.writeFileSync(recentOpensPath, JSON.stringify(recentOpens, null, 2));
}
