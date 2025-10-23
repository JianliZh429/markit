/**
 * Preview Module
 * Handles markdown preview functionality
 */

import { stateManager } from '../state';
import { MarkdownService } from '../services/markdownService';
import { debounce } from '../utils/performance';

export class PreviewModule {
  private previewElement: HTMLDivElement;
  private markdownService: MarkdownService;
  private updateTimeout: number | null = null;

  constructor(
    previewElement: HTMLDivElement,
    markdownService: MarkdownService
  ) {
    this.previewElement = previewElement;
    this.markdownService = markdownService;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Save scroll position
    this.previewElement.addEventListener('scroll', () => {
      stateManager.set('previewScrollTop', this.previewElement.scrollTop);
    });

    // Handle paste in preview mode
    this.previewElement.addEventListener('paste', (event) => {
      this.handlePaste(event);
    });

    // Handle Enter key in preview mode
    this.previewElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.handleEnter(event);
      }
    });

    // Real-time markdown preview in editable preview mode
    const debouncedUpdate = debounce(() => this.updateFromInput(), 300);
    this.previewElement.addEventListener('input', () => {
      debouncedUpdate();
    });
  }

  private handlePaste(event: ClipboardEvent): void {
    if (!stateManager.get('isEditMode')) {
      event.preventDefault();

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const htmlData = clipboardData.getData('text/html');
      const plainText = clipboardData.getData('text/plain');

      // Convert HTML to Markdown or use plain text
      const markdown = htmlData
        ? this.markdownService.htmlToMarkdown(htmlData)
        : plainText;

      // Append to preview content
      const currentText = this.previewElement.innerText || '';
      this.setMarkdownContent(currentText + '\n\n' + markdown);

      // Scroll to bottom
      setTimeout(() => {
        this.previewElement.scrollTop = this.previewElement.scrollHeight;
      }, 0);
    }
  }

  private handleEnter(event: KeyboardEvent): void {
    if (!stateManager.get('isEditMode')) {
      event.preventDefault();

      const selection = window.getSelection();
      if (!selection) return;

      const range = selection.getRangeAt(0);
      const br = document.createTextNode('\n');
      range.deleteContents();
      range.insertNode(br);

      // Move cursor after the line break
      range.setStartAfter(br);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      // Trigger input event for update
      this.previewElement.dispatchEvent(new Event('input'));
    }
  }

  private updateFromInput(): void {
    // Get plain text content from previewer
    const plainText = this.previewElement.innerText || this.previewElement.textContent || '';

    // Parse and update HTML
    const htmlContent = this.markdownService.parse(plainText);

    // Only update if content actually changed
    if (this.previewElement.innerHTML !== htmlContent) {
      // Save cursor position
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const cursorOffset = range ? this.getTextOffset(this.previewElement, range.startContainer, range.startOffset) : 0;

      this.previewElement.innerHTML = htmlContent;

      // Try to restore cursor position
      this.restoreCursorPosition(cursorOffset);
    }
  }

  private getTextOffset(container: Node, targetNode: Node, offset: number): number {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
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
        null
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
        range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      console.error('Error restoring cursor:', e);
    }
  }

  /**
   * Set markdown content and render to HTML
   */
  setMarkdownContent(markdown: string): void {
    const html = this.markdownService.parse(markdown);
    this.previewElement.innerHTML = html;
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
    this.previewElement.style.display = 'block';
    this.previewElement.contentEditable = makeEditable ? 'true' : 'false';

    // Restore scroll position
    const state = stateManager.getState();
    this.previewElement.scrollTop = state.previewScrollTop;

    if (makeEditable) {
      this.previewElement.focus();
    }
  }

  /**
   * Hide preview
   */
  hide(): void {
    // Save scroll position
    stateManager.set('previewScrollTop', this.previewElement.scrollTop);
    
    this.previewElement.style.display = 'none';
    this.previewElement.contentEditable = 'false';
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
}
