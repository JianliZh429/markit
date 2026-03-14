/**
 * Markdown Service
 * Handles markdown parsing and conversion
 */

import { LRUCache } from "../utils/performance.js";

export interface MarkdownAPI {
  parseMarkdown: (content: string) => string;
  setMarkdownBaseUrl: (url: string) => void;
}

export class MarkdownService {
  private renderCache: LRUCache<string, string>;

  constructor(private markdownAPI: MarkdownAPI) {
    // Cache up to 100 rendered markdown documents
    this.renderCache = new LRUCache<string, string>(100);
  }

  /**
   * Parse markdown to HTML with caching
   */
  /**
   * Parse markdown to HTML with optional anchor insertion
   */
  parse(content: string, anchor?: { line: number; context: string }): string {
    // 1. 解析成HTML
    let html = this.renderCache.get(content);
    if (!html) {
      html = this.markdownAPI.parseMarkdown(content);
      this.renderCache.set(content, html);
    }

    if (!anchor) return html;

    // 2. Use anchor util for data-anchor injection
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { injectAnchor } = require('../utils/anchor');
    return injectAnchor(html, anchor);
  }

  /**
   * Clear the render cache
   */
  clearCache(): void {
    this.renderCache.clear();
  }

  /**
   * Set base URL for relative links
   */
  setBaseUrl(url: string): void {
    this.markdownAPI.setMarkdownBaseUrl(url);
  }

  /**
   * Convert HTML to Markdown (for paste operations)
   */
  htmlToMarkdown(html: string): string {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return this.processNode(temp);
  }

  private processNode(node: Node): string {
    let markdown = "";

    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        markdown += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tag = element.tagName.toLowerCase();

        switch (tag) {
          case "table":
            markdown += this.convertTableToMarkdown(element);
            break;
          case "h1":
            markdown += `# ${this.processNode(element)}\n\n`;
            break;
          case "h2":
            markdown += `## ${this.processNode(element)}\n\n`;
            break;
          case "h3":
            markdown += `### ${this.processNode(element)}\n\n`;
            break;
          case "h4":
            markdown += `#### ${this.processNode(element)}\n\n`;
            break;
          case "h5":
            markdown += `##### ${this.processNode(element)}\n\n`;
            break;
          case "h6":
            markdown += `###### ${this.processNode(element)}\n\n`;
            break;
          case "strong":
          case "b":
            markdown += `**${this.processNode(element)}**`;
            break;
          case "em":
          case "i":
            markdown += `*${this.processNode(element)}*`;
            break;
          case "code":
            markdown += `\`${this.processNode(element)}\``;
            break;
          case "pre":
            markdown += `\n\`\`\`\n${this.processNode(element)}\n\`\`\`\n\n`;
            break;
          case "a":
            const href = element.getAttribute("href") || "";
            markdown += `[${this.processNode(element)}](${href})`;
            break;
          case "img":
            const src = element.getAttribute("src") || "";
            const alt = element.getAttribute("alt") || "";
            markdown += `![${alt}](${src})`;
            break;
          case "ul":
            markdown += `\n${this.processNode(element)}\n`;
            break;
          case "ol":
            markdown += `\n${this.processNode(element)}\n`;
            break;
          case "li":
            const parentTag = element.parentElement?.tagName.toLowerCase();
            if (parentTag === "ol") {
              markdown += `1. ${this.processNode(element)}\n`;
            } else {
              markdown += `- ${this.processNode(element)}\n`;
            }
            break;
          case "blockquote":
            markdown += `> ${this.processNode(element).split("\n").join("\n> ")}\n\n`;
            break;
          case "p":
            markdown += `${this.processNode(element)}\n\n`;
            break;
          case "br":
            markdown += "\n";
            break;
          case "hr":
            markdown += "\n---\n\n";
            break;
          case "del":
          case "s":
          case "strike":
            markdown += `~~${this.processNode(element)}~~`;
            break;
          default:
            markdown += this.processNode(element);
        }
      }
    }

    return markdown;
  }

  private convertTableToMarkdown(tableElement: HTMLElement): string {
    const rows: string[][] = [];
    let maxColumns = 0;

    const allRows = tableElement.querySelectorAll("tr");

    allRows.forEach((tr) => {
      const cells: string[] = [];
      const cellElements = tr.querySelectorAll("th, td");

      cellElements.forEach((cell) => {
        const content = this.processNode(cell).trim().replace(/\n/g, " ");
        cells.push(content);
      });

      if (cells.length > maxColumns) {
        maxColumns = cells.length;
      }

      rows.push(cells);
    });

    if (rows.length === 0) {
      return "";
    }

    let markdown = "\n";

    // Add header row
    const headerRow = rows[0];
    while (headerRow.length < maxColumns) {
      headerRow.push("");
    }
    markdown += "| " + headerRow.join(" | ") + " |\n";

    // Add separator row
    markdown += "|" + " --- |".repeat(maxColumns) + "\n";

    // Add data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      while (row.length < maxColumns) {
        row.push("");
      }
      markdown += "| " + row.join(" | ") + " |\n";
    }

    markdown += "\n";
    return markdown;
  }
}
