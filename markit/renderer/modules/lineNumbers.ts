/**
 * Line Numbers Module
 * Provides toggleable line number display for the editor
 */

export class LineNumbersModule {
  private gutterElement: HTMLDivElement;
  private editorElement: HTMLTextAreaElement;
  private isVisible: boolean = false;

  constructor(
    gutterElement: HTMLDivElement,
    editorElement: HTMLTextAreaElement,
  ) {
    this.gutterElement = gutterElement;
    this.editorElement = editorElement;

    // Sync scroll between gutter and editor
    this.editorElement.addEventListener('scroll', () => {
      this.syncScroll();
    });

    // Update line numbers on input
    this.editorElement.addEventListener('input', () => {
      this.update();
    });
  }

  /**
   * Show line numbers
   */
  show(): void {
    this.isVisible = true;
    this.gutterElement.classList.add('visible');
    this.update();
  }

  /**
   * Hide line numbers
   */
  hide(): void {
    this.isVisible = false;
    this.gutterElement.classList.remove('visible');
  }

  /**
   * Toggle line numbers visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if line numbers are visible
   */
  get visible(): boolean {
    return this.isVisible;
  }

  /**
   * Update line numbers based on editor content
   */
  update(): void {
    if (!this.isVisible) return;

    const lines = this.editorElement.value.split('\n');
    const lineCount = lines.length;

    // Generate line numbers
    let lineNumbersHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      lineNumbersHTML += `<div class="line-number">${i}</div>`;
    }

    this.gutterElement.innerHTML = lineNumbersHTML;
    this.syncScroll();
  }

  /**
   * Sync gutter scroll with editor scroll
   */
  private syncScroll(): void {
    if (!this.isVisible) return;
    this.gutterElement.scrollTop = this.editorElement.scrollTop;
  }

  /**
   * Get line number at a given character offset
   */
  offsetToLine(offset: number): number {
    const text = this.editorElement.value.substring(0, offset);
    return text.split('\n').length;
  }

  /**
   * Get character offset for the start of a given line (1-based)
   */
  lineToOffset(line: number): number {
    const lines = this.editorElement.value.split('\n');
    let offset = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      offset += lines[i].length + 1;
    }
    return offset;
  }

  /**
   * Highlight a specific line number
   */
  highlightLine(line: number): void {
    if (!this.isVisible) return;

    // Remove previous highlights
    const previousHighlights = this.gutterElement.querySelectorAll('.line-number.highlighted');
    previousHighlights.forEach(el => el.classList.remove('highlighted'));

    // Highlight the target line
    const lineElements = this.gutterElement.querySelectorAll('.line-number');
    if (line > 0 && line <= lineElements.length) {
      lineElements[line - 1].classList.add('highlighted');
    }
  }

  /**
   * Clear all line highlights
   */
  clearHighlights(): void {
    const highlights = this.gutterElement.querySelectorAll('.line-number.highlighted');
    highlights.forEach(el => el.classList.remove('highlighted'));
  }
}
