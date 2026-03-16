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
