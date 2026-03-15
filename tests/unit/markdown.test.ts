import { isMarkdownFile } from "../markit/main/security";

describe("markdown extension tests", () => {
  test("accepts .md and .markdown", () => {
    expect(isMarkdownFile("readme.md")).toBe(true);
    expect(isMarkdownFile("README.MARKDOWN")).toBe(true);
  });
  test("rejects other extensions", () => {
    expect(isMarkdownFile("notes.txt")).toBe(false);
    expect(isMarkdownFile("script.js")).toBe(false);
  });
  test("rejects no extension", () => {
    expect(isMarkdownFile("file")).toBe(false);
  });
});
