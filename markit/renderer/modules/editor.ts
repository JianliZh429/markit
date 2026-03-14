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

  private handlePaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const htmlData = clipboardData.getData("text/html");
    const plainText = clipboardData.getData("text/plain");

    if (htmlData) {
      event.preventDefault();

      // Convert HTML to Markdown
      const markdown = this.markdownService.htmlToMarkdown(htmlData);

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
   * Get anchor info (line, offset, context)
   */
  getAnchorInfo(): { line: number; offset: number; context: string } {
    const value = this.editorElement.value;
    const cursorOffset = this.editorElement.selectionStart;
    const lines = value.substring(0, cursorOffset).split('\n');
    const lineNum = lines.length - 1;
    const currentLine = lines[lineNum] || '';
    const anchorInLine = cursorOffset - (value.lastIndexOf('\n', cursorOffset - 1) + 1);
    const context = currentLine.substring(
      Math.max(0, anchorInLine - 5),
      anchorInLine + 5
    );
    return { line: lineNum, offset: cursorOffset, context };
  }

  /**
   * Restore caret to anchor info if possible
   */
  restoreAnchor(anchor: { line: number; offset: number; context: string }): void {
    const lines = this.editorElement.value.split('\n');
    const lineStr = lines[anchor.line] || '';
    let index = lineStr.indexOf(anchor.context);
    if (index === -1) index = 0;
    let offset = 0;
    for (let i = 0; i < anchor.line; i++) offset += lines[i].length + 1;
    offset += index + anchor.context.length;
    this.editorElement.setSelectionRange(offset, offset);
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
