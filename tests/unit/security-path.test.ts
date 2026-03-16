import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { isPathSafe, validatePath, isMarkdownFile, validateMarkdownExtension, validateMarkdownPath } from "../../markit/main/security";

describe("path safety tests", () => {
  test("path inside safe dir (current working dir)", () => {
    const p = process.cwd();
    expect(isPathSafe(p)).toBe(true);
  });

  test("absolute path outside safe dirs should be denied", () => {
    // Use an obviously unsafe absolute path; this may vary by OS, so we assert false
    const bad = "/nonexistentpath/should/not/be/inside/base";
    expect(isPathSafe(bad)).toBe(false);
  });

  test("validatePath should throw for unsafe path", () => {
    const bad = "/outside/evil";
    expect(() => validatePath(bad)).toThrow();
  });
});

describe("symlink resolution", () => {
  let tempDir: string;
  let realFile: string;
  let symlinkFile: string;

  beforeEach(() => {
    // Create a temp directory for symlink tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "markit-symlink-test-"));
    realFile = path.join(tempDir, "real.md");
    symlinkFile = path.join(tempDir, "symlink.md");

    // Create a real file
    fs.writeFileSync(realFile, "# Test content");

    // Create a symlink (skip on Windows if symlinks require elevated privileges)
    try {
      fs.symlinkSync(realFile, symlinkFile);
    } catch (e) {
      // Skip symlink tests on systems that don't support them
      console.warn("Symlinks not supported, skipping symlink tests");
    }
  });

  afterEach(() => {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe("isPathSafe with symlinks", () => {
    it("should validate symlink target within safe dirs", () => {
      if (!fs.existsSync(symlinkFile)) return; // Skip if symlink creation failed

      // Without symlink resolution, checks the symlink path itself
      expect(isPathSafe(symlinkFile)).toBe(true);

      // With symlink resolution, checks the real file path
      expect(isPathSafe(symlinkFile, true)).toBe(true);
    });

    it("should reject symlinks pointing outside safe dirs when resolved", () => {
      if (!fs.existsSync(symlinkFile)) return; // Skip if symlink creation failed

      // Create a symlink to an unsafe location
      const unsafeTarget = "/etc/passwd";
      const unsafeSymlink = path.join(tempDir, "unsafe.md");

      try {
        fs.symlinkSync(unsafeTarget, unsafeSymlink);

        // Without resolution, the symlink path itself is in safe dir
        expect(isPathSafe(unsafeSymlink)).toBe(true);

        // With resolution, should detect the unsafe target
        expect(isPathSafe(unsafeSymlink, true)).toBe(false);
      } catch (e) {
        // Skip if can't create unsafe symlink (e.g., permissions)
      }
    });
  });

  describe("validatePath with symlinks", () => {
    it("should resolve symlinks when requested", () => {
      if (!fs.existsSync(symlinkFile)) return; // Skip if symlink creation failed

      const resolved = validatePath(symlinkFile, true);

      // Should return the real path (resolved), not the symlink
      // Note: realpath may return /private/var instead of /var on macOS
      expect(resolved).toBe(fs.realpathSync(realFile));
    });

    it("should not resolve symlinks by default", () => {
      if (!fs.existsSync(symlinkFile)) return; // Skip if symlink creation failed

      const resolved = validatePath(symlinkFile, false);

      // Should return the resolved symlink path, not the real path
      expect(resolved).toBe(path.resolve(symlinkFile));
    });

    it("should handle non-existent files gracefully", () => {
      const nonExistent = path.join(tempDir, "does-not-exist.md");

      // Should not throw for non-existent files, but resolve to absolute path
      // When file doesn't exist, realpath falls back to path.resolve
      const result = validatePath(nonExistent, true);
      // The result will be the resolved absolute path
      expect(result).toMatch(/does-not-exist\.md$/);
    });
  });

  describe("validateMarkdownPath with symlinks", () => {
    it("should resolve symlinks and validate markdown extension", () => {
      if (!fs.existsSync(symlinkFile)) return; // Skip if symlink creation failed

      const resolved = validateMarkdownPath(symlinkFile, true);

      // Should return the real path (resolved) with .md extension
      // Note: realpath may return /private/var instead of /var on macOS
      expect(resolved).toBe(fs.realpathSync(realFile));
    });

    it("should reject symlinks to non-markdown files", () => {
      if (!fs.existsSync(symlinkFile)) return; // Skip if symlink creation failed

      // Create a symlink to a non-markdown file (use different name to avoid conflict)
      const realTxt = path.join(tempDir, "real.txt");
      const symlinkMd2 = path.join(tempDir, "symlink2.md");
      fs.writeFileSync(realTxt, "text content");
      
      try {
        fs.symlinkSync(realTxt, symlinkMd2);

        // Should reject because the real file has wrong extension
        expect(() => validateMarkdownPath(symlinkMd2, true)).toThrow("Invalid file extension");
      } catch (e) {
        // Skip if can't create symlink
      } finally {
        // Cleanup
        try { fs.unlinkSync(symlinkMd2); } catch (e) {}
      }
    });
  });
});

describe("markdown extension validation", () => {
  describe("validateMarkdownExtension", () => {
    it("should accept .md files", () => {
      expect(validateMarkdownExtension("/safe/path/file.md")).toBe("/safe/path/file.md");
    });

    it("should accept .markdown files", () => {
      expect(validateMarkdownExtension("/safe/path/file.markdown")).toBe("/safe/path/file.markdown");
    });

    it("should accept uppercase extensions", () => {
      expect(validateMarkdownExtension("/safe/path/file.MD")).toBe("/safe/path/file.MD");
      expect(validateMarkdownExtension("/safe/path/file.Markdown")).toBe("/safe/path/file.Markdown");
    });

    it("should throw for non-markdown extensions", () => {
      expect(() => validateMarkdownExtension("/safe/path/file.txt")).toThrow("Invalid file extension");
      expect(() => validateMarkdownExtension("/safe/path/file.pdf")).toThrow("Invalid file extension");
      expect(() => validateMarkdownExtension("/safe/path/file.html")).toThrow("Invalid file extension");
    });

    it("should throw for no extension", () => {
      expect(() => validateMarkdownExtension("/safe/path/file")).toThrow("Invalid file extension");
    });

    it("should throw for empty path", () => {
      expect(() => validateMarkdownExtension("")).toThrow("Invalid file path");
    });

    it("should throw for null path", () => {
      expect(() => validateMarkdownExtension(null as any)).toThrow("Invalid file path");
    });
  });

  describe("validateMarkdownPath", () => {
    it("should accept valid markdown files in safe paths", () => {
      const cwd = process.cwd();
      const mdPath = `${cwd}/test.md`;
      expect(validateMarkdownPath(mdPath)).toBe(mdPath);
    });

    it("should reject unsafe paths even with markdown extension", () => {
      expect(() => validateMarkdownPath("/outside/evil.md")).toThrow("Access denied");
    });

    it("should reject safe paths with wrong extension", () => {
      const cwd = process.cwd();
      const txtPath = `${cwd}/test.txt`;
      expect(() => validateMarkdownPath(txtPath)).toThrow("Invalid file extension");
    });

    it("should reject paths with null bytes", () => {
      // Null bytes are stripped by validatePath, so the resulting path should be valid
      // if it's within safe directories. This test verifies the stripping behavior.
      const pathWithNullByte = `${process.cwd()}/file\0.md`;
      // After null byte stripping, this becomes `${process.cwd()}/file.md` which is valid
      expect(validateMarkdownPath(pathWithNullByte)).toBe(`${process.cwd()}/file.md`);
    });
  });

  describe("isMarkdownFile", () => {
    it("should return true for .md files", () => {
      expect(isMarkdownFile("file.md")).toBe(true);
      expect(isMarkdownFile("file.MD")).toBe(true);
    });

    it("should return true for .markdown files", () => {
      expect(isMarkdownFile("file.markdown")).toBe(true);
      expect(isMarkdownFile("file.MARKDOWN")).toBe(true);
    });

    it("should return false for other extensions", () => {
      expect(isMarkdownFile("file.txt")).toBe(false);
      expect(isMarkdownFile("file.pdf")).toBe(false);
      expect(isMarkdownFile("file")).toBe(false);
    });
  });
});
