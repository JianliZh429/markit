/**
 * Editor Module
 * Handles markdown editor functionality
 */

import { stateManager } from "../state.js";
import { MarkdownService } from "../services/markdownService.js";

export class EditorModule {
  private editorElement: HTMLTextAreaElement;
  private markdownService: MarkdownService;

  constructor(
    editorElement: HTMLTextAreaElement,
    markdownService: MarkdownService,
  ) {
    this.editorElement = editorElement;
    this.markdownService = markdownService;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Save scroll position and selection on input
    this.editorElement.addEventListener("scroll", () => {
      stateManager.set("editorScrollTop", this.editorElement.scrollTop);
    });

    this.editorElement.addEventListener("select", () => {
      stateManager.setState({
        editorSelectionStart: this.editorElement.selectionStart,
        editorSelectionEnd: this.editorElement.selectionEnd,
      });
    });

    // Handle paste with HTML to Markdown conversion
    this.editorElement.addEventListener("paste", (event) => {
      this.handlePaste(event);
    });
  }

  private async handlePaste(event: ClipboardEvent): Promise<void> {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const htmlData = clipboardData.getData("text/html");
    const plainText = clipboardData.getData("text/plain");

    if (htmlData) {
      event.preventDefault();

      // Convert HTML to Markdown (async for large content)
      const markdown = await this.markdownService.htmlToMarkdown(htmlData);

      // Insert at cursor position
      const start = this.editorElement.selectionStart;
      const end = this.editorElement.selectionEnd;
      const text = this.editorElement.value;

      this.editorElement.value =
        text.substring(0, start) + markdown + text.substring(end);

      // Set cursor position after inserted text
      const newPosition = start + markdown.length;
      this.editorElement.setSelectionRange(newPosition, newPosition);
    }
    // Otherwise, let default paste behavior handle plain text
  }

  /**
   * Set editor content
   */
  setContent(content: string): void {
    this.editorElement.value = content;
  }

  /**
   * Get editor content
   */
  getContent(): string {
    return this.editorElement.value;
  }

  /**
   * Show editor
   */
  show(): void {
    this.editorElement.style.display = "block";

    // Restore editor state
    const state = stateManager.getState();
    this.editorElement.scrollTop = state.editorScrollTop;
    this.editorElement.setSelectionRange(
      state.editorSelectionStart,
      state.editorSelectionEnd,
    );
    this.editorElement.focus();
  }

  /**
   * Hide editor
   */
  hide(): void {
    // Save current state before hiding
    stateManager.setState({
      editorScrollTop: this.editorElement.scrollTop,
      editorSelectionStart: this.editorElement.selectionStart,
      editorSelectionEnd: this.editorElement.selectionEnd,
    });

    this.editorElement.style.display = "none";
  }

  /**
   * Select all content
   */
  selectAll(): void {
    this.editorElement.focus();
    this.editorElement.select();
  }

  /**
   * Focus editor
   */
  focus(): void {
    this.editorElement.focus();
  }

  /**
   * Convert character offset to line number
   */
  offsetToLine(offset: number): number {
    const text = this.editorElement.value.substring(0, offset);
    return text.split("\n").length - 1;
  }

  /**
   * Convert line number to character offset
   */
  lineToOffset(line: number): number {
    const lines = this.editorElement.value.split("\n");
    let offset = 0;
    for (let i = 0; i < line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    return offset;
  }

  /**
   * Get current cursor line
   */
  getCursorLine(): number {
    return this.offsetToLine(this.editorElement.selectionStart);
  }

  /**
   * Set cursor to specific line
   */
  setCursorLine(line: number): void {
    const offset = this.lineToOffset(line);
    this.editorElement.setSelectionRange(offset, offset);
    // Also scroll to make the line visible
    this.scrollToLine(line);
  }

  /**
   * Scroll to specific line without changing cursor position
   */
  scrollToLine(line: number): void {
    const lineHeight = this.getLineHeight();
    const targetY = line * lineHeight;
    
    // Scroll to bring the line into view
    this.editorElement.scrollTop = targetY - (this.editorElement.clientHeight / 2) + (lineHeight / 2);
  }

  /**
   * Center the cursor in viewport
   */
  centerCursorInView(): void {
    const cursorLine = this.getCursorLine();
    const lineHeight = this.getLineHeight();
    const visibleLines = Math.floor(this.editorElement.clientHeight / lineHeight);
    
    // Calculate scroll position to center cursor
    const cursorY = cursorLine * lineHeight;
    const targetScroll = cursorY - (this.editorElement.clientHeight / 2) + (lineHeight / 2);
    
    this.editorElement.scrollTop = Math.max(0, targetScroll);
  }

  /**
   * Get line height (approximate)
   */
  private getLineHeight(): number {
    const computedStyle = window.getComputedStyle(this.editorElement);
    const lineHeight = computedStyle.lineHeight;
    
    // Parse line-height (could be "normal", a number, or px/em)
    if (lineHeight === "normal") {
      // Approximate "normal" as 1.2 * font-size
      const fontSize = parseFloat(computedStyle.fontSize);
      return fontSize * 1.2;
    }
    
    return parseFloat(lineHeight) || 20; // fallback to 20px
  }

  /**
   * Set cursor position from character offset and center view
   */
  setCursorPosition(offset: number): void {
    this.editorElement.setSelectionRange(offset, offset);
    this.centerCursorInView();
  }

  /**
   * Get current cursor offset
   */
  getCursorOffset(): number {
    return this.editorElement.selectionStart;
  }

  /**
   * Save cursor position to state
   */
  saveCursorPosition(): void {
    stateManager.setState({
      editorSelectionStart: this.editorElement.selectionStart,
      editorSelectionEnd: this.editorElement.selectionEnd,
    });
  }
}
