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
    
    this.scrollToCurrentMatch();
    this.highlightCurrentMatch();
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
    
    this.scrollToCurrentMatch();
    this.highlightCurrentMatch();
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
   * Scroll to current match
   */
  private scrollToCurrentMatch(): void {
    if (!this.state || this.state.currentMatchIndex === -1) return;

    const matchPosition = this.state.matches[this.state.currentMatchIndex];
    
    // For editor (textarea)
    if (this.editorElement.offsetParent !== null) {
      this.scrollToMatchInEditor(matchPosition);
    }
  }

  /**
   * Scroll editor to match position
   */
  private scrollToMatchInEditor(position: number): void {
    // Calculate approximate line number
    const content = this.editorElement.value;
    const textBeforeMatch = content.substring(0, position);
    const lineNumber = textBeforeMatch.split("\n").length - 1;
    
    // Calculate scroll position
    const lineHeight = 24; // Approximate line height in pixels
    const targetScroll = lineNumber * lineHeight - (this.editorElement.clientHeight / 2);
    
    this.editorElement.scrollTop = Math.max(0, targetScroll);
    
    // Select the matched text
    this.editorElement.focus();
    this.editorElement.setSelectionRange(
      position,
      position + (this.state?.searchTerm.length ?? 0)
    );
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
