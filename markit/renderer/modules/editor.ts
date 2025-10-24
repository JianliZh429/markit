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
}
