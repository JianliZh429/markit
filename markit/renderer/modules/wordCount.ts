/**
 * Word Count Module
 * Calculates and displays word count, character count, and reading time
 */

export interface WordCountStats {
  words: number;
  characters: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTime: number; // in minutes
}

export class WordCountModule {
  private $wordCountContainer: HTMLElement;
  private $wordsElement: HTMLElement;
  private $charactersElement: HTMLElement;
  private $readingTimeElement: HTMLElement;
  private $readingTimeRow: HTMLElement;
  private $toggleButton: HTMLElement;
  private isVisible: boolean = true;

  // Average reading speed: 200-250 words per minute
  private readonly WORDS_PER_MINUTE = 200;

  constructor(
    wordCountContainer: HTMLElement,
    wordsElement: HTMLElement,
    charactersElement: HTMLElement,
    readingTimeElement: HTMLElement,
    readingTimeRow: HTMLElement,
    toggleButton: HTMLElement
  ) {
    this.$wordCountContainer = wordCountContainer;
    this.$wordsElement = wordsElement;
    this.$charactersElement = charactersElement;
    this.$readingTimeElement = readingTimeElement;
    this.$readingTimeRow = readingTimeRow;
    this.$toggleButton = toggleButton;
    this.setupEventListeners();
  }

  /**
   * Calculate word count statistics from text
   * Handles both Western languages (space-separated) and CJK (Chinese, Japanese, Korean)
   */
  public calculateStats(text: string): WordCountStats {
    // Trim the text for accurate counting
    const trimmedText = text.trim();

    // Character count
    const characters = text.length;
    const charactersWithoutSpaces = text.replace(/\s/g, '').length;

    // Word count - different strategy for CJK vs Western languages
    let words = 0;
    if (trimmedText !== '') {
      // Count CJK characters (each CJK character counts as one word)
      const cjkChars = (trimmedText.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g) || []).length;
      
      // Count Western words (space-separated)
      const westernText = trimmedText.replace(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, ' ');
      const westernWords = westernText.split(/\s+/).filter(word => word.length > 0).length;
      
      // Total words = CJK characters + Western words
      words = cjkChars + westernWords;
    }

    // Sentence count - includes CJK punctuation (.!?。！？)
    const sentences = trimmedText === '' ? 0 : (trimmedText.match(/[.!?。！？]+/g) || []).length;

    // Paragraph count - split by double newlines
    const paragraphs = trimmedText === '' ? 0 : trimmedText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    // Reading time in minutes
    // CJK: ~300-500 characters per minute, Western: ~200 words per minute
    // Use average of 250 for mixed content
    const readingTime = Math.ceil(words / this.WORDS_PER_MINUTE);

    return {
      words,
      characters,
      charactersWithoutSpaces,
      sentences,
      paragraphs,
      readingTime: Math.max(1, readingTime), // Minimum 1 minute
    };
  }

  /**
   * Update the display with current statistics
   */
  public update(text: string): void {
    const stats = this.calculateStats(text);

    this.$wordsElement.textContent = `${stats.words} words`;
    this.$charactersElement.textContent = `${stats.characters} chars`;

    // Show reading time row only for longer content
    if (stats.words >= 50) {
      this.$readingTimeElement.textContent = `~${stats.readingTime} min read`;
      this.$readingTimeRow.style.display = 'flex';
    } else {
      this.$readingTimeRow.style.display = 'none';
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.$toggleButton.addEventListener('click', () => {
      this.toggle();
    });
  }

  /**
   * Toggle word count display visibility
   */
  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Show word count display
   */
  public show(): void {
    this.isVisible = true;
    this.$wordCountContainer.classList.remove('hidden');
  }

  /**
   * Hide word count display
   */
  public hide(): void {
    this.isVisible = false;
    this.$wordCountContainer.classList.add('hidden');
  }

  /**
   * Check if word count is visible
   */
  public get visible(): boolean {
    return this.isVisible;
  }
}
