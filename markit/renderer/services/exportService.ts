/**
 * Export Service
 * Handles exporting markdown to various formats (HTML, PDF)
 */

import { LRUCache } from "../utils/performance.js";

export type ExportFormat = 'html' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeStyles?: boolean;
  outputPath?: string;
}

export class ExportService {
  private parseMarkdown: (content: string) => string;
  private cache: LRUCache<string, string>;

  constructor(parseMarkdown: (content: string) => string) {
    this.parseMarkdown = parseMarkdown;
    this.cache = new LRUCache(50);
  }
  /**
   * Export markdown content to HTML
   */
  public async exportToHtml(markdown: string, title: string = 'Exported Document'): Promise<string> {
    // Basic HTML template with embedded styles
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, 'Noto Sans CJK SC', 'Noto Sans CJK TC', 'Noto Sans CJK JP', 'Noto Sans CJK KR', sans-serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #24292e;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    h5 { font-size: 0.875em; }
    h6 { font-size: 0.85em; color: #6a737d; }
    p { margin-top: 0; margin-bottom: 16px; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27,31,35,0.05);
      border-radius: 3px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    }
    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 3px;
    }
    pre code {
      display: inline;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
    }
    blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin: 0;
    }
    ul, ol {
      padding-left: 2em;
      margin-top: 0;
      margin-bottom: 16px;
    }
    li { margin-top: 0.25em; }
    li + li { margin-top: 0.25em; }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      margin-top: 0;
      margin-bottom: 16px;
    }
    table th, table td {
      padding: 6px 13px;
      border: 1px solid #dfe2e5;
    }
    table tr:nth-child(2n) {
      background-color: #f6f8fa;
    }
    img {
      max-width: 100%;
      height: auto;
      box-sizing: content-box;
    }
    hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #e1e4e8;
      border: 0;
    }
    @media print {
      @page {
        size: A4;
        margin: 20mm;
      }
      body { 
        padding: 0;
        margin: 0;
        max-width: 100%;
        font-size: 11pt;
        line-height: 1.6;
        color: #000;
        background: #fff;
        font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans CJK TC', 'Noto Sans CJK JP', 'Noto Sans CJK KR', 'SimSun', sans-serif !important;
      }
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        page-break-inside: avoid;
      }
      h1 { font-size: 18pt; }
      h2 { font-size: 16pt; }
      h3 { font-size: 14pt; }
      h4 { font-size: 12pt; }
      h5 { font-size: 11pt; }
      h6 { font-size: 10pt; }
      p {
        orphans: 3;
        widows: 3;
      }
      pre, code {
        font-size: 9pt;
        background: #f5f5f5 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        page-break-inside: avoid;
      }
      blockquote {
        page-break-inside: avoid;
        border-left: 3px solid #ccc !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      table {
        page-break-inside: avoid;
      }
      table th, table td {
        font-size: 9pt;
      }
      img {
        max-width: 100% !important;
        page-break-inside: avoid;
      }
      a {
        color: #000;
        text-decoration: underline;
      }
      a[href]:after {
        content: " (" attr(href) ")";
        font-size: 8pt;
      }
      hr {
        border-top: 1px solid #000;
        background: none;
      }
      /* Hide elements not needed in print */
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
${this.markdownToHtml(markdown)}
</body>
</html>`;

    return html;
  }

  /**
   * Export to PDF - returns HTML for rendering
   * Actual PDF generation happens in main process via IPC
   */
  public async exportToPdf(markdown: string, title: string = 'Exported Document'): Promise<string> {
    // Generate and return HTML for main process to convert to PDF
    return await this.exportToHtml(markdown, title);
  }

  /**
   * Download HTML as file using blob
   */
  public downloadHtml(html: string, filename: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.html') ? filename : filename + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Convert markdown to HTML using marked parser
   */
  private markdownToHtml(markdown: string): string {
    // Check cache first
    const cached = this.cache.get(markdown);
    if (cached) {
      return cached;
    }
    
    // Parse markdown to HTML
    const html = this.parseMarkdown(markdown);
    
    // Cache the result
    this.cache.set(markdown, html);
    
    return html;
  }
}
