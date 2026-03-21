/**
 * Markdown Service
 * Handles markdown parsing and conversion
 */

import { LRUCache, hashContent } from "../utils/performance.js";
import DOMPurify from "dompurify";

export interface MarkdownAPI {
  parseMarkdown: (content: string) => string;
  setMarkdownBaseUrl: (url: string) => void;
}

// Worker message types
interface WorkerMessage {
  html: string;
  id: number;
}

interface WorkerResponse {
  markdown?: string;
  error?: string;
  id: number;
}

// Threshold in bytes for when to use worker vs sync conversion
export const WORKER_THRESHOLD = 10240; // 10KB

export class MarkdownService {
  private renderCache: LRUCache<string, string>; // Keyed by content hash
  private worker: Worker | null = null;
  private workerMessageId = 0;
  private workerPromises: Map<number, { resolve: (value: string) => void; reject: (error: Error) => void }> = new Map();
  private workerInitialized = false;

  constructor(private markdownAPI: MarkdownAPI) {
    // Cache up to 100 rendered markdown documents, keyed by content hash
    this.renderCache = new LRUCache<string, string>(100);
  }

  /**
   * Initialize the worker lazily
   */
  private getWorker(): Worker | null {
    if (!this.worker) {
      try {
        // Create worker using blob URL from inline script for browser compatibility
        const workerScriptPath = "./workers/htmlToMarkdown.worker.js";
        this.worker = new Worker(workerScriptPath);

        this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
          const { markdown, error, id } = e.data;
          const pending = this.workerPromises.get(id);
          if (pending) {
            if (error) {
              pending.reject(new Error(error));
            } else {
              pending.resolve(markdown!);
            }
            this.workerPromises.delete(id);
          }
        };

        this.worker.onerror = (error) => {
          console.error("Worker error:", error);
          // Reject all pending promises
          this.workerPromises.forEach((pending) => {
            pending.reject(new Error("Worker error"));
          });
          this.workerPromises.clear();
        };

        this.workerInitialized = true;
      } catch (error) {
        console.error("Failed to initialize worker:", error);
        this.worker = null;
      }
    }
    return this.worker;
  }

  /**
   * Parse markdown to HTML with caching (keyed by content hash)
   */
  parse(content: string): string {
    // Generate hash key for content
    const contentHash = hashContent(content);
    
    // Check cache first
    const cached = this.renderCache.get(contentHash);
    if (cached) {
      return cached;
    }

    // Parse and cache the result
    const html = this.markdownAPI.parseMarkdown(content);
    this.renderCache.set(contentHash, html);
    return html;
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
   * Sync version of htmlToMarkdown for small content
   */
  private processNodeSync(node: Node): string {
    let markdown = "";

    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        markdown += child.textContent || "";
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tag = element.tagName.toLowerCase();

        switch (tag) {
          case "table":
            markdown += this.convertTableToMarkdownSync(element);
            break;
          case "h1":
            markdown += `# ${this.processNodeSync(element)}\n\n`;
            break;
          case "h2":
            markdown += `## ${this.processNodeSync(element)}\n\n`;
            break;
          case "h3":
            markdown += `### ${this.processNodeSync(element)}\n\n`;
            break;
          case "h4":
            markdown += `#### ${this.processNodeSync(element)}\n\n`;
            break;
          case "h5":
            markdown += `##### ${this.processNodeSync(element)}\n\n`;
            break;
          case "h6":
            markdown += `###### ${this.processNodeSync(element)}\n\n`;
            break;
          case "strong":
          case "b":
            markdown += `**${this.processNodeSync(element)}**`;
            break;
          case "em":
          case "i":
            markdown += `*${this.processNodeSync(element)}*`;
            break;
          case "code":
            markdown += `\`${this.processNodeSync(element)}\``;
            break;
          case "pre":
            markdown += `\n\`\`\`\n${this.processNodeSync(element)}\n\`\`\`\n\n`;
            break;
          case "a":
            const href = element.getAttribute("href") || "";
            markdown += `[${this.processNodeSync(element)}](${href})`;
            break;
          case "img":
            const src = element.getAttribute("src") || "";
            const alt = element.getAttribute("alt") || "";
            markdown += `![${alt}](${src})`;
            break;
          case "ul":
            markdown += `\n${this.processNodeSync(element)}\n`;
            break;
          case "ol":
            markdown += `\n${this.processNodeSync(element)}\n`;
            break;
          case "li":
            const parentTag = element.parentElement?.tagName.toLowerCase();
            if (parentTag === "ol") {
              markdown += `1. ${this.processNodeSync(element)}\n`;
            } else {
              markdown += `- ${this.processNodeSync(element)}\n`;
            }
            break;
          case "blockquote":
            markdown += `> ${this.processNodeSync(element).split("\n").join("\n> ")}\n\n`;
            break;
          case "p":
            markdown += `${this.processNodeSync(element)}\n\n`;
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
            markdown += `~~${this.processNodeSync(element)}~~`;
            break;
          default:
            markdown += this.processNodeSync(element);
        }
      }
    }

    return markdown;
  }

  private convertTableToMarkdownSync(tableElement: HTMLElement): string {
    const rows: string[][] = [];
    let maxColumns = 0;

    const allRows = tableElement.querySelectorAll("tr");

    allRows.forEach((tr) => {
      const cells: string[] = [];
      const cellElements = tr.querySelectorAll("th, td");

      cellElements.forEach((cell) => {
        const content = this.processNodeSync(cell).trim().replace(/\n/g, " ");
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

    const headerRow = rows[0];
    while (headerRow.length < maxColumns) {
      headerRow.push("");
    }
    markdown += "| " + headerRow.join(" | ") + " |\n";
    markdown += "|" + " --- |".repeat(maxColumns) + "\n";

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

  /**
   * Convert HTML to Markdown (for paste operations)
   * Sanitizes HTML before conversion to prevent XSS attacks
   * Uses worker for large content, sync for small
   * @returns Promise resolving to markdown string
   */
  async htmlToMarkdown(html: string): Promise<string> {
    // Sanitize HTML first to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(html);
    
    // For small content, use sync conversion (faster, no overhead)
    if (sanitizedHtml.length < WORKER_THRESHOLD) {
      const temp = document.createElement("div");
      temp.innerHTML = sanitizedHtml;
      return this.processNodeSync(temp);
    }

    // For large content, use worker
    return this.htmlToMarkdownAsync(sanitizedHtml);
  }

  /**
   * Async version using Web Worker for large content
   */
  private async htmlToMarkdownAsync(html: string): Promise<string> {
    const worker = this.getWorker();
    
    if (!worker || !this.workerInitialized) {
      // Fallback to sync if worker failed to initialize
      const temp = document.createElement("div");
      temp.innerHTML = html;
      return this.processNodeSync(temp);
    }

    this.workerMessageId++;
    const id = this.workerMessageId;

    return new Promise((resolve, reject) => {
      // Set timeout for worker communication
      const timeout = setTimeout(() => {
        this.workerPromises.delete(id);
        // Fallback to sync if worker times out
        const temp = document.createElement("div");
        temp.innerHTML = html;
        resolve(this.processNodeSync(temp));
      }, 5000); // 5 second timeout

      this.workerPromises.set(id, {
        resolve: (markdown) => {
          clearTimeout(timeout);
          resolve(markdown);
        },
        reject: (error) => {
          clearTimeout(timeout);
          // Fallback to sync on error
          const temp = document.createElement("div");
          temp.innerHTML = html;
          resolve(this.processNodeSync(temp));
        },
      });

      worker.postMessage({ html, id });
    });
  }

  /**
   * Shutdown worker on service disposal
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
