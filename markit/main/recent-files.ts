import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const recentFilesPath = path.join(app.getPath('userData'), 'recent-files.json');
console.log('recentFilesPath: ', recentFilesPath);

// Load recent files from JSON
export function load(): string[] {
  try {
    const data = fs.readFileSync(recentFilesPath, 'utf-8');
    return JSON.parse(data) as string[];
  } catch (_error: unknown) {
    return [];
  }
}

// Save recent files to JSON
function save(recentFiles: string[]): void {
  fs.writeFileSync(recentFilesPath, JSON.stringify(recentFiles, null, 2));
}

// Add a file to the recent files list
export function add(filePath: string): void {
  const recentFiles = load();
  const index = recentFiles.indexOf(filePath);
  console.log('index: ', index);
  if (index !== -1) {
    recentFiles.splice(index, 1);
  }
  console.log('recentFiles: ', recentFiles);
  recentFiles.unshift(filePath);
  if (recentFiles.length > 10) {
    recentFiles.pop();
  }
  console.log('recentFiles: ', recentFiles);
  save(recentFiles);
}
