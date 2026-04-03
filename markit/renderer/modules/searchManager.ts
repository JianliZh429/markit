/**
 * Search Manager Module
 * Handles find next/previous functionality with auto-scroll and replace
 */

export interface SearchState {
  matches: number[];
  currentMatchIndex: number;
  searchTerm: string;
  content: string;
  caseSensitive: boolean;
  useRegex: boolean;
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
   * Get current search options
   */
  getSearchOptions(): { caseSensitive: boolean; useRegex: boolean } {
    return {
      caseSensitive: this.state?.caseSensitive ?? false,
      useRegex: this.state?.useRegex ?? false,
    };
  }

  /**
   * Perform initial search and find all matches
   */
  search(content: string, searchTerm: string, caseSensitive: boolean = false, useRegex: boolean = false, autoSelect: boolean = false): void {
    if (!searchTerm) {
      this.clear();
      return;
    }

    const matches = this.findAllMatches(content, searchTerm, caseSensitive, useRegex);

    this.state = {
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1,
      searchTerm,
      content,
      caseSensitive,
      useRegex,
    };

    this.highlightMatches(content, searchTerm, useRegex);
    if (autoSelect) {
      this.selectCurrentMatchInEditor();
    }
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
    this.selectCurrentMatchInEditor();
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
    this.selectCurrentMatchInEditor();
    this.scrollToCurrentMatch();
  }

  /**
   * Clear search state
   */
  clear(): void {
    this.state = null;
  }

  /**
   * Select current match in editor textarea
   */
  private selectCurrentMatchInEditor(): void {
    if (!this.state || this.state.currentMatchIndex === -1) return;

    const matchOffset = this.state.matches[this.state.currentMatchIndex];
    const matchLength = this.state.searchTerm.length;

    // Select the match in the textarea
    this.editorElement.setSelectionRange(matchOffset, matchOffset + matchLength);
    this.editorElement.focus();

    // Scroll to make the selection visible
    this.scrollToSelection();
  }

  /**
   * Scroll editor to make the current selection visible
   */
  private scrollToSelection(): void {
    const lineHeight = this.getLineHeight();
    const selectionStart = this.editorElement.selectionStart;
    
    // Calculate which line the selection is on
    const textBeforeSelection = this.editorElement.value.substring(0, selectionStart);
    const currentLine = textBeforeSelection.split('\n').length - 1;
    
    // Calculate target scroll position
    const targetY = currentLine * lineHeight;
    const viewportHeight = this.editorElement.clientHeight;
    
    // Check if selection is outside viewport
    const currentScrollTop = this.editorElement.scrollTop;
    const selectionY = currentLine * lineHeight;
    
    if (selectionY < currentScrollTop || selectionY > currentScrollTop + viewportHeight - lineHeight) {
      // Scroll to center the selection
      this.editorElement.scrollTop = selectionY - (viewportHeight / 2) + (lineHeight / 2);
    }
  }

  /**
   * Get approximate line height
   */
  private getLineHeight(): number {
    const computedStyle = window.getComputedStyle(this.editorElement);
    const lineHeight = computedStyle.lineHeight;
    
    if (lineHeight === "normal") {
      const fontSize = parseFloat(computedStyle.fontSize);
      return fontSize * 1.2;
    }
    
    return parseFloat(lineHeight) || 20;
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
   * Replace current match
   */
  replaceCurrent(replacement: string): boolean {
    if (!this.state || this.state.currentMatchIndex === -1) return false;

    const matchOffset = this.state.matches[this.state.currentMatchIndex];
    const matchLength = this.state.searchTerm.length;

    // Replace in content
    const before = this.state.content.substring(0, matchOffset);
    const after = this.state.content.substring(matchOffset + matchLength);
    this.state.content = before + replacement + after;

    // Update editor content
    this.editorElement.value = this.state.content;

    // Re-run search on updated content
    this.search(this.state.content, this.state.searchTerm, this.state.caseSensitive, this.state.useRegex);

    return true;
  }

  /**
   * Replace all matches
   */
  replaceAll(replacement: string): number {
    if (!this.state || this.state.matches.length === 0) return 0;

    const { caseSensitive, useRegex, searchTerm } = this.state;
    const flags = caseSensitive ? "g" : "gi";
    
    let pattern: string;
    if (useRegex) {
      pattern = searchTerm;
    } else {
      pattern = this.escapeRegex(searchTerm);
    }

    const regex = new RegExp(pattern, flags);
    const newContent = this.state.content.replace(regex, replacement);
    
    // Update editor content
    this.editorElement.value = newContent;
    this.state.content = newContent;

    // Clear search after replace all
    this.search(newContent, searchTerm, caseSensitive, useRegex);

    return this.state.matches.length;
  }

  /**
   * Check if search is active
   */
  hasActiveSearch(): boolean {
    return this.state !== null && this.state.matches.length > 0;
  }

  /**
   * Get current search state (for external access)
   */
  getState(): SearchState | null {
    return this.state;
  }

  /**
   * Find all matches in content
   */
  private findAllMatches(content: string, searchTerm: string, caseSensitive: boolean, useRegex: boolean): number[] {
    const matches: number[] = [];
    const flags = caseSensitive ? "g" : "gi";
    
    let pattern: string;
    if (useRegex) {
      pattern = searchTerm;
    } else {
      pattern = this.escapeRegex(searchTerm);
    }
    
    const regex = new RegExp(pattern, flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      matches.push(match.index);
    }

    return matches;
  }

  /**
   * Highlight all matches in result element
   */
  private highlightMatches(content: string, searchTerm: string, useRegex: boolean): void {
    const { caseSensitive } = this.state || { caseSensitive: false };
    const flags = caseSensitive ? "g" : "gi";
    
    let pattern: string;
    if (useRegex) {
      pattern = `(${searchTerm})`;
    } else {
      pattern = `(${this.escapeRegex(searchTerm)})`;
    }
    
    const regex = new RegExp(pattern, flags);
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
