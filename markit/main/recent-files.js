const { app } = require("electron");
const path = require("path");
const fs = require("fs");

const recentFilesPath = path.join(app.getPath("userData"), "recent-files.json");
console.log("recentFilesPath: ", recentFilesPath);
// Load recent files from JSON
function load() {
  try {
    const data = fs.readFileSync(recentFilesPath, "utf-8");
    return JSON.parse(data);
  } catch (_error) {
    return [];
  }
}

// Save recent files to JSON
function save(recentFiles) {
  fs.writeFileSync(recentFilesPath, JSON.stringify(recentFiles, null, 2));
}

// Add a file to the recent files list
function add(filePath) {
  const recentFiles = load();
  const index = recentFiles.indexOf(filePath);
  console.log("index: ", index);
  if (index !== -1) {
    recentFiles.splice(index, 1);
  }
  console.log("recentFiels: ", recentFiles);
  recentFiles.unshift(filePath);
  if (recentFiles.length > 10) {
    recentFiles.pop();
  }
  console.log("recentFiels: ", recentFiles);
  save(recentFiles);
}

module.exports = { load, add };
