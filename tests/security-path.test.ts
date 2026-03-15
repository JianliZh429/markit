import { isPathSafe, validatePath, isMarkdownFile } from "../markit/main/security";

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
