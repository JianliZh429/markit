/**
 * Search Manager Module
 * Handles find next/previous functionality with auto-scroll
 */

export interface SearchState {
  matches: number[];
  currentMatchIndex: number;
  searchTerm: string;
  content: string;
}

export class SearchManager {
  private state: SearchState | null = null;
  private editorElement: HTMLTextAreaElement;
  private resultElement: HTMLDivElement;

  constructor(
    editorElement: HTMLTextAreaElement,
    resultElement: HTMLDivElement,
  ) {
    this.editorElement = editorElement;
    this.resultElement = resultElement;
  }

  /**
   * Perform initial search and find all matches
   */
  search(content: string, searchTerm: string): void {
    if (!searchTerm) {
      this.clear();
      return;
    }

    const matches = this.findAllMatches(content, searchTerm);
    
    this.state = {
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1,
      searchTerm,
      content,
    };

    this.highlightMatches(content, searchTerm);
    this.scrollToCurrentMatch();
  }

  /**
   * Find next match
   */
  findNext(): void {
    if (!this.state || this.state.matches.length === 0) return;

    this.state.currentMatchIndex = 
      (this.state.currentMatchIndex + 1) % this.state.matches.length;
    
    this.highlightCurrentMatch();
    this.scrollToCurrentMatch();
  }

  /**
   * Find previous match
   */
  findPrevious(): void {
    if (!this.state || this.state.matches.length === 0) return;

    const { matches } = this.state;
    this.state.currentMatchIndex = 
      this.state.currentMatchIndex <= 0 
        ? matches.length - 1 
        : this.state.currentMatchIndex - 1;
    
    this.highlightCurrentMatch();
    this.scrollToCurrentMatch();
  }

  /**
   * Clear search state
   */
  clear(): void {
    this.state = null;
  }

  /**
   * Get current match count
   */
  getMatchCount(): number {
    return this.state?.matches.length ?? 0;
  }

  /**
   * Get current match position (1-based)
   */
  getCurrentMatchPosition(): number {
    if (!this.state || this.state.currentMatchIndex === -1) return 0;
    return this.state.currentMatchIndex + 1;
  }

  /**
   * Check if search is active
   */
  hasActiveSearch(): boolean {
    return this.state !== null && this.state.matches.length > 0;
  }

  /**
   * Find all matches in content
   */
  private findAllMatches(content: string, searchTerm: string): number[] {
    const matches: number[] = [];
    const regex = new RegExp(searchTerm, "gi");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      matches.push(match.index);
    }

    return matches;
  }

  /**
   * Highlight all matches in result element
   */
  private highlightMatches(content: string, searchTerm: string): void {
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, "gi");
    const highlighted = content.replace(regex, "<mark>$1</mark>");
    this.resultElement.innerHTML = highlighted;
  }

  /**
   * Highlight current match with different color
   */
  private highlightCurrentMatch(): void {
    // Remove previous current match highlighting
    const previousCurrent = this.resultElement.querySelector("mark.current");
    if (previousCurrent) {
      previousCurrent.classList.remove("current");
    }

    // Add current match highlighting
    const marks = this.resultElement.querySelectorAll("mark");
    if (this.state && marks[this.state.currentMatchIndex]) {
      marks[this.state.currentMatchIndex].classList.add("current");
    }
  }

  /**
   * Scroll to current match in result div
   */
  private scrollToCurrentMatch(): void {
    if (!this.state || this.state.currentMatchIndex === -1) return;

    // Get all mark elements in the result div
    const marks = this.resultElement.querySelectorAll("mark");
    if (marks.length === 0 || this.state.currentMatchIndex >= marks.length) return;

    const currentMark = marks[this.state.currentMatchIndex];
    
    // Scroll the result div to show the current match
    const resultRect = this.resultElement.getBoundingClientRect();
    const markRect = currentMark.getBoundingClientRect();
    
    // Check if mark is outside viewport
    const isAbove = markRect.top < resultRect.top;
    const isBelow = markRect.bottom > resultRect.bottom;
    
    if (isAbove || isBelow) {
      // Scroll to center the match
      this.resultElement.scrollTop = 
        currentMark.offsetTop - (this.resultElement.clientHeight / 2);
    }
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
