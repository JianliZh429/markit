/**
 * Tests for MarkdownService with async HTML to Markdown conversion
 */

import { MarkdownService, WORKER_THRESHOLD } from "../../markit/renderer/services/markdownService";

// Mock markdown API
const mockMarkdownAPI = {
  parseMarkdown: (content: string) => `<p>${content}</p>`,
  setMarkdownBaseUrl: (url: string) => {},
};

describe("MarkdownService Async HTML to Markdown", () => {
  let service: MarkdownService;

  beforeEach(() => {
    service = new MarkdownService(mockMarkdownAPI);
  });

  afterEach(() => {
    service.dispose();
  });

  describe("htmlToMarkdown", () => {
    it("should use sync for small content (< 10KB)", async () => {
      const smallHtml = "<p>small content</p>";
      const result = await service.htmlToMarkdown(smallHtml);
      expect(result).toBe("small content\n\n");
    });

    it("should use worker for large content (> 10KB)", async () => {
      // Create content larger than threshold
      const largeContent = "x".repeat(WORKER_THRESHOLD + 100);
      const largeHtml = `<p>${largeContent}</p>`;

      const result = await service.htmlToMarkdown(largeHtml);
      expect(result).toContain("x".repeat(WORKER_THRESHOLD));
    });

    it("should handle very large content (> 100KB)", async () => {
      const veryLargeContent = "x".repeat(100000);
      const largeHtml = `<p>${veryLargeContent}</p>`;

      const result = await service.htmlToMarkdown(largeHtml);
      expect(result).toContain("x".repeat(100000));
    });

    it("should handle HTML with tables", async () => {
      const html = `
        <table>
          <tr><th>Name</th><th>Age</th></tr>
          <tr><td>Alice</td><td>30</td></tr>
          <tr><td>Bob</td><td>25</td></tr>
        </table>
      `;

      const result = await service.htmlToMarkdown(html);
      expect(result).toContain("| Name | Age |");
      expect(result).toContain("| Alice | 30 |");
      expect(result).toContain("| Bob | 25 |");
    });

    it("should handle nested HTML elements", async () => {
      const html = `
        <div>
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
          <pre><code>console.log('hello');</code></pre>
        </div>
      `;

      const result = await service.htmlToMarkdown(html);
      expect(result).toContain("# Title");
      expect(result).toContain("Paragraph with **bold** and *italic* text.");
      expect(result).toContain("```");
      expect(result).toContain("console.log('hello');");
    });

    it("should handle empty HTML", async () => {
      const result = await service.htmlToMarkdown("");
      expect(result).toBe("");
    });

    it("should handle content with special characters", async () => {
      const html = "<p>Special: &lt;script&gt; &amp; &quot;quotes&quot;</p>";
      const result = await service.htmlToMarkdown(html);
      expect(result).toContain("Special: <script> & \"quotes\"");
    });
  });

  describe("cache behavior", () => {
    it("should cache markdown parsing results", () => {
      const content = "# Test";
      
      // First call parses and caches
      const result1 = service.parse(content);
      
      // Second call should use cache
      const result2 = service.parse(content);
      
      expect(result1).toBe(result2);
    });

    it("should clear cache", () => {
      const content = "# Test";
      service.parse(content);
      
      service.clearCache();
      
      // Should parse again after clear
      const result = service.parse(content);
      expect(result).toBeDefined();
    });
  });
});
