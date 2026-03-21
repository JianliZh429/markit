/**
 * Table of Contents Module
 * Generates and manages table of contents from markdown headers
 */

export interface TocItem {
  id: string;
  text: string;
  level: number;
  children?: TocItem[];
}

export class TocModule {
  private $tocPanel: HTMLElement;
  private $tocContainer: HTMLElement;
  private onTocItemClick: (id: string) => void;
  private isVisible: boolean = false;

  constructor(tocPanel: HTMLElement, tocContainer: HTMLElement, onTocItemClick: (id: string) => void) {
    this.$tocPanel = tocPanel;
    this.$tocContainer = tocContainer;
    this.onTocItemClick = onTocItemClick;
  }

  /**
   * Generate TOC from markdown content
   */
  public generateToc(markdown: string): TocItem[] {
    const lines = markdown.split('\n');
    const toc: TocItem[] = [];
    const stack: TocItem[] = [];

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = this.slugify(text);

        // Skip headings that result in empty IDs
        if (!id) {
          continue;
        }

        const item: TocItem = { id, text, level };

        // Find parent level
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          toc.push(item);
        } else {
          const parent = stack[stack.length - 1];
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(item);
        }

        stack.push(item);
      }
    }

    return toc;
  }

  /**
   * Render TOC in the container
   */
  public renderToc(toc: TocItem[]): void {
    this.$tocContainer.innerHTML = '';

    if (toc.length === 0) {
      this.$tocContainer.innerHTML = `
        <div class="toc-empty">
          <p>No headings found</p>
          <p class="toc-hint">Add headings (# to ######) to generate a table of contents</p>
        </div>
      `;
      return;
    }

    const $ul = this.renderTocItems(toc);
    this.$tocContainer.appendChild($ul);
  }

  /**
   * Recursively render TOC items
   */
  private renderTocItems(items: TocItem[]): HTMLUListElement {
    const $ul = document.createElement('ul');
    $ul.className = 'toc-list';

    for (const item of items) {
      const $li = document.createElement('li');
      $li.className = `toc-item toc-level-${item.level}`;

      const $a = document.createElement('a');
      $a.href = `#${item.id}`;
      $a.textContent = item.text;
      $a.dataset.tocId = item.id;
      $a.addEventListener('click', (e) => {
        e.preventDefault();
        this.onTocItemClick(item.id);
      });

      $li.appendChild($a);

      if (item.children && item.children.length > 0) {
        const $childUl = this.renderTocItems(item.children);
        $li.appendChild($childUl);
      }

      $ul.appendChild($li);
    }

    return $ul;
  }

  /**
   * Generate slug from text (supports Unicode including CJK characters)
   */
  private slugify(text: string): string {
    // First, try to preserve Unicode characters by using URL encoding for non-ASCII
    // This ensures Chinese, Japanese, Korean, and other scripts work correctly
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep Unicode letters, numbers, spaces, hyphens
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Show TOC panel
   */
  public show(): void {
    this.isVisible = true;
    this.$tocPanel.classList.add('toc-visible');
    this.$tocPanel.classList.remove('toc-hidden');
  }

  /**
   * Hide TOC panel
   */
  public hide(): void {
    this.isVisible = false;
    this.$tocPanel.classList.add('toc-hidden');
    this.$tocPanel.classList.remove('toc-visible');
  }

  /**
   * Toggle TOC visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if TOC is visible
   */
  public get visible(): boolean {
    return this.isVisible;
  }

  /**
   * Update TOC from markdown content
   */
  public update(markdown: string): void {
    const toc = this.generateToc(markdown);
    this.renderToc(toc);
  }
}
