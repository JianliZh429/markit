import * as path from "path";
import * as fs from "fs";

import { app, dialog } from "electron";
import * as os from "os";

/**
 * Security utility for path validation and sanitization
 */

// Lazy-initialize safe base directories to work in both main and preload contexts
let SAFE_BASE_PATHS: string[] | null = null;

function getSafeBasePaths(): string[] {
  if (SAFE_BASE_PATHS === null) {
    // Try to use app.getPath if available (main process), otherwise use os module (preload)
    try {
      if (app && typeof app.getPath === "function") {
        SAFE_BASE_PATHS = [
          app.getPath("home"),
          app.getPath("documents"),
          app.getPath("desktop"),
          app.getPath("downloads"),
          app.getPath("userData"),
          app.getPath("temp"),
        ];
      } else {
        // Fallback for preload context
        const homeDir = os.homedir();
        SAFE_BASE_PATHS = [
          homeDir,
          path.join(homeDir, "Documents"),
          path.join(homeDir, "Desktop"),
          path.join(homeDir, "Downloads"),
          os.tmpdir(),
        ];
      }
    } catch (error) {
      // Last resort fallback
      const homeDir = os.homedir();
      SAFE_BASE_PATHS = [homeDir];
    }

    // Add resolved realpath versions of safe base paths to handle symlinks
    // (e.g., /var -> /private/var on macOS)
    const resolvedPaths: string[] = [];
    for (const basePath of SAFE_BASE_PATHS) {
      try {
        const resolved = fs.realpathSync(basePath);
        if (resolved !== basePath) {
          resolvedPaths.push(resolved);
        }
      } catch (e) {
        // Ignore if realpath fails
      }
    }
    SAFE_BASE_PATHS = [...SAFE_BASE_PATHS, ...resolvedPaths];
  }
  return SAFE_BASE_PATHS;
}

/**
 * Validates if a path is safe to access
 * Prevents directory traversal attacks and restricts to safe directories
 * 
 * @param filePath - The path to validate
 * @param resolveSymlinks - Whether to resolve symlinks (default: false for performance)
 */
export function isPathSafe(filePath: string, resolveSymlinks: boolean = false): boolean {
  try {
    // Resolve to absolute path
    let absolutePath = path.resolve(filePath);

    // Optionally resolve symlinks to their real paths
    if (resolveSymlinks) {
      try {
        absolutePath = fs.realpathSync(absolutePath);
      } catch (e) {
        // If realpath fails (e.g., file doesn't exist), fall back to the resolved path
        // This allows validation of non-existent files
        absolutePath = path.resolve(filePath);
      }
    }

    // Check if path is within any safe base directory
    const safePaths = getSafeBasePaths();
    const isSafe = safePaths.some((basePath) => {
      const relativePath = path.relative(basePath, absolutePath);
      // If the path is inside the base, it will NOT start with ".." and will be
      // a relative path (or empty string for the exact base dir).
      return (
        !relativePath.startsWith("..") &&
        !path.isAbsolute(relativePath)
      );
    });

    return isSafe;
  } catch (error) {
    // Handle potential errors from path operations or symlink resolution
    return false;
  }
}

/**
 * Validates and sanitizes a file path
 * @param filePath - The path to validate
 * @param resolveSymlinks - Whether to resolve symlinks (default: false)
 * @throws Error if path is unsafe
 */
export function validatePath(filePath: string, resolveSymlinks: boolean = false): string {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path: Path must be a non-empty string");
  }

  // Remove any null bytes
  const sanitized = filePath.replace(/\0/g, "");

  // Resolve symlinks if requested
  let validatedPath = sanitized;
  if (resolveSymlinks) {
    try {
      validatedPath = fs.realpathSync(path.resolve(sanitized));
    } catch (error) {
      // If realpath fails (e.g., file doesn't exist), fall back to resolved path
      validatedPath = path.resolve(sanitized);
    }
  } else {
    validatedPath = path.resolve(sanitized);
  }

  if (!isPathSafe(validatedPath, resolveSymlinks)) {
    throw new Error(
      `Access denied: Path is outside allowed directories: ${validatedPath}`,
    );
  }

  return validatedPath;
}

/**
 * Validates that a file path has a markdown extension
 * @throws Error if extension is not .md or .markdown
 */
export function validateMarkdownExtension(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path: Path must be a non-empty string");
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".md" && ext !== ".markdown") {
    throw new Error(
      `Invalid file extension: Only .md and .markdown files are supported (got: ${ext || "no extension"})`,
    );
  }

  return filePath;
}

/**
 * Validates and sanitizes a markdown file path
 * Combines path safety and markdown extension checks
 * @param filePath - The path to validate
 * @param resolveSymlinks - Whether to resolve symlinks (default: false)
 * @throws Error if path is unsafe or not a markdown file
 */
export function validateMarkdownPath(filePath: string, resolveSymlinks: boolean = false): string {
  // First validate path safety (with optional symlink resolution)
  const safePath = validatePath(filePath, resolveSymlinks);
  // Then validate markdown extension
  return validateMarkdownExtension(safePath);
}

/**
 * Validates that a path only contains markdown files
 */
export function isMarkdownFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".md" || ext === ".markdown";
}

/**
 * Shows an error dialog to the user
 */
export async function showErrorDialog(
  message: string,
  detail?: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: "error",
    title: "Error",
    message: message,
    detail: detail,
    buttons: ["OK"],
  });
}

/**
 * Shows a warning dialog to the user
 */
export async function showWarningDialog(
  message: string,
  detail?: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: "warning",
    title: "Warning",
    message: message,
    detail: detail,
    buttons: ["OK"],
  });
}
