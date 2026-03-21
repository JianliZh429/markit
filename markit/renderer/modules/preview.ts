/**
 * Preview Module
 * Handles markdown preview functionality
 * 
 * FIX: Preview mode input stability - we now keep a shadow markdown source
 * and only sync when necessary, avoiding constant re-rendering that corrupts
 * the contentEditable state.
 */

import { stateManager } from "../state.js";
import { MarkdownService } from "../services/markdownService.js";
import { debounce } from "../utils/performance.js";

export class PreviewModule {
  private previewElement: HTMLDivElement;
  private markdownService: MarkdownService;
  private markdownContent: string = "";
  // Shadow copy of the markdown source text for stable editing
  private shadowMarkdown: string = "";
  // Flag to prevent recursive updates
  private isUpdating: boolean = false;

  constructor(
    previewElement: HTMLDivElement,
    markdownService: MarkdownService,
  ) {
    this.previewElement = previewElement;
    this.markdownService = markdownService;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Save scroll position
    this.previewElement.addEventListener("scroll", () => {
      stateManager.set("previewScrollTop", this.previewElement.scrollTop);
    });

    // Track mouse position for line highlighting and cursor sync
    this.previewElement.addEventListener("mousemove", (event) => {
      this.handleMouseMove(event);
    });

    // Handle paste in preview mode
    this.previewElement.addEventListener("paste", (event) => {
      this.handlePaste(event);
    });

    // Handle Enter key in preview mode
    this.previewElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.handleEnter(event);
      }
    });

    // Real-time markdown preview in editable preview mode
    // FIX: Only sync when not in mode switching to prevent corruption
    const debouncedSync = debounce(() => this.syncFromPreview(), 500);
    this.previewElement.addEventListener("input", () => {
      // Don't sync during mode switching or when updating internally
      if (!stateManager.get("isModeSwitching") && !this.isUpdating) {
        debouncedSync();
      }
    });
  }

  /**
   * Handle mouse move to track current line
   */
  private handleMouseMove(event: MouseEvent): void {
    const line = this.getLineNumberAtMouse(event);
    // Store the line number for later use when switching modes
    stateManager.set('previewHoverLine', line);
  }

  /**
   * Get line number at mouse position using element text matching
   * Maps hovered HTML element to markdown source line
   */
  private getLineNumberAtMouse(event: MouseEvent): number {
    // Get the element at mouse position
    const target = event.target as HTMLElement;
    
    // Find the closest block-level element that contains actual text
    const blockElement = target.closest('p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, code, tr, td, th');
    
    if (blockElement) {
      // Get the text content of this element
      const elementText = blockElement.textContent?.trim() || '';
      
      if (elementText) {
        // Get the markdown content from shadow (source of truth)
        const markdownContent = this.shadowMarkdown || '';
        const markdownLines = markdownContent.split('\n');
        
        // Search for this text in markdown lines
        for (let i = 0; i < markdownLines.length; i++) {
          const line = markdownLines[i].trim();
          // Check for partial match (at least 10 chars to avoid false positives)
          if (line.length >= 10 && elementText.length >= 10) {
            // Check if lines share significant common text
            const commonText = this.findCommonText(line, elementText);
            if (commonText.length >= 10) {
              return i;
            }
          }
        }
      }
    }
    
    // Fallback: use caret range method
    return this.getLineNumberFromCaret(event);
  }

  /**
   * Find common text between two strings (ignoring markdown formatting)
   */
  private findCommonText(str1: string, str2: string): string {
    // Remove markdown formatting for comparison
    const clean1 = str1.replace(/[`*_~\[\]()]/g, '');
    const clean2 = str2.replace(/[`*_~\[\]()]/g, '');
    
    // Find longest common substring
    let longest = '';
    for (let i = 0; i < clean1.length; i++) {
      for (let j = i + 10; j <= clean1.length; j++) {
        const substr = clean1.substring(i, j);
        if (clean2.includes(substr) && substr.length > longest.length) {
          longest = substr;
        }
      }
    }
    
    return longest;
  }

  /**
   * Get line number from caret position (fallback method)
   */
  private getLineNumberFromCaret(event: MouseEvent): number {
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    
    if (!range) {
      return this.calculateLineFromYPosition(event.clientY);
    }
    
    const textNode = range.startContainer;
    
    let currentNode: Node | null = textNode;
    while (currentNode && currentNode !== this.previewElement) {
      currentNode = currentNode.parentNode;
    }
    
    if (!currentNode) {
      return this.calculateLineFromYPosition(event.clientY);
    }
    
    const walker = document.createTreeWalker(
      this.previewElement,
      NodeFilter.SHOW_TEXT,
      null,
    );
    
    let charCount = 0;
    let node: Node | null;
    
    while ((node = walker.nextNode())) {
      if (node === textNode) {
        charCount += range.startOffset;
        break;
      }
      charCount += node.textContent?.length || 0;
    }
    
    const markdownContent = this.shadowMarkdown || this.previewElement.innerText || '';
    const textBefore = markdownContent.substring(0, charCount);
    const lineNumber = (textBefore.match(/\n/g) || []).length;
    
    return Math.max(0, lineNumber);
  }

  /**
   * Fallback: calculate line from Y position
   */
  private calculateLineFromYPosition(clientY: number): number {
    const containerRect = this.previewElement.getBoundingClientRect();
    const scrollTop = this.previewElement.scrollTop;
    const relativeY = clientY - containerRect.top + scrollTop;
    const lineHeight = parseFloat(getComputedStyle(this.previewElement).lineHeight) || 24;
    return Math.max(0, Math.floor(relativeY / lineHeight));
  }

  private async handlePaste(event: ClipboardEvent): Promise<void> {
    if (!stateManager.get("isEditMode")) {
      event.preventDefault();

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const htmlData = clipboardData.getData("text/html");
      const plainText = clipboardData.getData("text/plain");

      // Convert HTML to Markdown or use plain text (async for large content)
      const markdown = htmlData
        ? await this.markdownService.htmlToMarkdown(htmlData)
        : plainText;

      // Insert at cursor position in contentEditable
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(markdown));
        range.collapse(false);
      } else {
        // Fallback: append to end
        this.shadowMarkdown += "\n\n" + markdown;
        this.previewElement.innerText = this.shadowMarkdown;
      }
    }
  }

  private handleEnter(event: KeyboardEvent): void {
    if (!stateManager.get("isEditMode")) {
      // Let the default Enter behavior work naturally in contentEditable
      // The input event listener will handle syncing
    }
  }

  /**
   * Sync preview content back to shadow markdown
   * FIX: This is now debounced and only called when not switching modes
   */
  private syncFromPreview(): void {
    if (this.isUpdating) return;
    
    // Get plain text content from previewer
    const plainText = this.previewElement.innerText || "";
    this.shadowMarkdown = plainText;
  }

  /**
   * Convert character offset to line/column position
   */
  private offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
    const lines = text.substring(0, offset).split("\n");
    return {
      line: lines.length - 1,
      column: lines[lines.length - 1].length,
    };
  }

  /**
   * Convert line/column position to character offset
   */
  private lineColumnToOffset(text: string, line: number, column: number): number {
    const lines = text.split("\n");
    let offset = 0;
    for (let i = 0; i < line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    return offset + Math.min(column, lines[line]?.length || 0);
  }

  private getTextOffset(
    container: Node,
    targetNode: Node,
    offset: number,
  ): number {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let totalOffset = 0;
    let node: Node | null;

    while ((node = walker.nextNode())) {
      if (node === targetNode) {
        return totalOffset + offset;
      }
      totalOffset += node.textContent?.length || 0;
    }

    return totalOffset;
  }

  private restoreCursorPosition(offset: number): void {
    try {
      const selection = window.getSelection();
      if (!selection) return;

      const walker = document.createTreeWalker(
        this.previewElement,
        NodeFilter.SHOW_TEXT,
        null,
      );

      let currentOffset = 0;
      let targetNode: Node | null = null;
      let targetOffset = 0;

      let node: Node | null;
      while ((node = walker.nextNode())) {
        const nodeLength = node.textContent?.length || 0;

        if (currentOffset + nodeLength >= offset) {
          targetNode = node;
          targetOffset = offset - currentOffset;
          break;
        }

        currentOffset += nodeLength;
      }

      if (targetNode) {
        const range = document.createRange();
        range.setStart(
          targetNode,
          Math.min(targetOffset, targetNode.textContent?.length || 0),
        );
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      console.error("Error restoring cursor:", e);
    }
  }

  /**
   * Set markdown content and render to HTML
   */
  setMarkdownContent(markdown: string): void {
    const html = this.markdownService.parse(markdown);
    this.previewElement.innerHTML = html;
    this.markdownContent = markdown;
    this.shadowMarkdown = markdown;  // Store markdown source for line mapping
  }
  /**
   * Get plain text content (markdown source)
   */
  getMarkdownContent(): string {
    return this.markdownContent || this.previewElement.innerText || "";
  }
  /**
   * Get HTML content
   */
  getHtmlContent(): string {
    return this.previewElement.innerHTML;
  }

  /**
   * Show preview
   */
  show(makeEditable: boolean = false): void {
    this.previewElement.style.display = "block";
    this.previewElement.contentEditable = makeEditable ? "true" : "false";

    // Restore scroll position
    const state = stateManager.getState();
    this.previewElement.scrollTop = state.previewScrollTop;

    if (makeEditable) {
      this.previewElement.focus();
       // Restore cursor position from state
      const cursorOffset = state.previewCursorOffset;
      if (cursorOffset > 0) {
        this.restoreCursorPosition(cursorOffset);
        this.centerCursorInView();
      }
    }
  }

  /**
   * Hide preview
   */
  hide(): void {
    // Save scroll position
    stateManager.set("previewScrollTop", this.previewElement.scrollTop);

    this.previewElement.style.display = "none";
    this.previewElement.contentEditable = "false";
  }

  /**
   * Select all content
   */
  selectAll(): void {
    this.previewElement.focus();
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(this.previewElement);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Focus preview
   */
  focus(): void {
    this.previewElement.focus();
  }

  /**
   * Set cursor position from offset
   */
  setCursorPosition(offset: number): void {
    this.restoreCursorPosition(offset);
    this.centerCursorInView();
  }

  /**
   * Get current cursor offset
   */
  getCursorOffset(): number {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    return this.getTextOffset(
      this.previewElement,
      range.startContainer,
      range.startOffset,
    );
  }

  /**
   * Get current cursor line number
   */
  getCursorLine(): number {
    const text = this.previewElement.innerText || "";
    const offset = this.getCursorOffset();
    const lines = text.substring(0, offset).split("\n");
    return lines.length - 1;
  }

  /**
   * Set cursor to specific line
   */
  setCursorLine(line: number): void {
    const text = this.previewElement.innerText || "";
    const offset = this.lineColumnToOffset(text, line, 0);
    this.restoreCursorPosition(offset);
    this.centerCursorInView();
  }

  /**
   * Save cursor position to state
   */
  saveCursorPosition(): void {
    stateManager.setState({
      previewCursorOffset: this.getCursorOffset(),
    });
  }
  
  /** Center helper kept for compatibility in other code paths */
  centerCursorInView(): void {
    // Simple scroll centering around current selection range; robust enough for tests
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = this.previewElement.getBoundingClientRect();
    const cursorCenter = rect.top + rect.height / 2 - containerRect.top;
    const containerHeight = this.previewElement.clientHeight;
    const currentScroll = this.previewElement.scrollTop;
    const targetScroll = currentScroll + cursorCenter - containerHeight / 2;
    this.previewElement.scrollTop = Math.max(0, targetScroll);
  }
}
