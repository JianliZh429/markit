/**
 * Table Editor Module
 * Helps users create and edit markdown tables visually
 */

export interface TableOptions {
  rows: number;
  columns: number;
  headerText?: string;
}

export class TableEditorModule {
  private editorElement: HTMLTextAreaElement;

  constructor(editorElement: HTMLTextAreaElement) {
    this.editorElement = editorElement;
  }

  /**
   * Insert a markdown table at cursor position
   */
  public insertTable(options: TableOptions): void {
    const { rows, columns, headerText = 'Header' } = options;
    
    // Generate markdown table
    const table = this.generateMarkdownTable(rows, columns, headerText);
    
    // Insert at cursor position
    this.insertAtCursor(table);
  }

  /**
   * Generate markdown table string
   */
  private generateMarkdownTable(rows: number, columns: number, headerText: string): string {
    const headers: string[] = [];
    const separators: string[] = [];
    const tableRows: string[] = [];

    // Create header row
    for (let i = 0; i < columns; i++) {
      headers.push(`${headerText} ${i + 1}`);
      separators.push('---');
    }

    // Create data rows
    for (let i = 0; i < rows; i++) {
      const row: string[] = [];
      for (let j = 0; j < columns; j++) {
        row.push(`Cell ${i + 1}-${j + 1}`);
      }
      tableRows.push(row.join(' | '));
    }

    // Assemble table
    const table = [
      '| ' + headers.join(' | ') + ' |',
      '| ' + separators.join(' | ') + ' |',
      ...tableRows.map(row => '| ' + row + ' |')
    ].join('\n');

    return '\n' + table + '\n';
  }

  /**
   * Insert text at cursor position with undo support
   */
  private insertAtCursor(text: string): void {
    this.editorElement.focus();
    
    // Use execCommand which creates undoable actions
    // This is the only reliable way to integrate with browser undo/redo
    const inserted = document.execCommand('insertText', false, text);
    
    if (!inserted) {
      // Fallback for browsers that don't support insertText
      const start = this.editorElement.selectionStart;
      const end = this.editorElement.selectionEnd;
      const content = this.editorElement.value;
      
      this.editorElement.value = content.substring(0, start) + text + content.substring(end);
      this.editorElement.setSelectionRange(start + text.length, start + text.length);
    }
  }

  /**
   * Convert selected text to table (if tabular data detected)
   */
  public convertToTable(): boolean {
    const start = this.editorElement.selectionStart;
    const end = this.editorElement.selectionEnd;
    
    if (start === end) {
      return false; // No selection
    }

    const selectedText = this.editorElement.value.substring(start, end);
    const lines = selectedText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return false; // Need at least 2 lines for a table
    }

    // Try to detect tabular data (tabs or consistent delimiters)
    const delimiter = this.detectDelimiter(lines);
    if (!delimiter) {
      return false;
    }

    // Convert to markdown table
    const table = this.convertLinesToTable(lines, delimiter);
    
    // Replace selection with table
    this.editorElement.value = 
      this.editorElement.value.substring(0, start) + 
      table + 
      this.editorElement.value.substring(end);

    return true;
  }

  /**
   * Detect delimiter in lines
   */
  private detectDelimiter(lines: string[]): string | null {
    if (lines.length === 0) return null;

    // Check for tabs
    if (lines[0].includes('\t')) {
      return '\t';
    }

    // Check for commas (CSV)
    if (lines[0].includes(',')) {
      return ',';
    }

    // Check for pipes
    if (lines[0].includes('|')) {
      return '|';
    }

    // Check for consistent spaces (simple heuristic)
    const firstLineParts = lines[0].split(/\s{2,}/);
    if (firstLineParts.length > 1) {
      // Verify other lines have same structure
      const allMatch = lines.every(line => 
        line.split(/\s{2,}/).length === firstLineParts.length
      );
      if (allMatch) {
        return 'spaces';
      }
    }

    return null;
  }

  /**
   * Convert lines to markdown table
   */
  private convertLinesToTable(lines: string[], delimiter: string): string {
    const parsedRows: string[][] = [];

    for (const line of lines) {
      let parts: string[];
      
      if (delimiter === 'spaces') {
        parts = line.split(/\s{2,}/).map(p => p.trim());
      } else if (delimiter === '|') {
        parts = line.split('|').map(p => p.trim()).filter(p => p);
      } else {
        parts = line.split(delimiter).map(p => p.trim());
      }

      parsedRows.push(parts);
    }

    // Normalize row lengths
    const maxColumns = Math.max(...parsedRows.map(r => r.length));
    for (const row of parsedRows) {
      while (row.length < maxColumns) {
        row.push('');
      }
    }

    // Build markdown table
    const headers = parsedRows[0];
    const separators = headers.map(() => '---');
    const dataRows = parsedRows.slice(1);

    const table = [
      '| ' + headers.join(' | ') + ' |',
      '| ' + separators.join(' | ') + ' |',
      ...dataRows.map(row => '| ' + row.join(' | ') + ' |')
    ].join('\n');

    return '\n' + table + '\n';
  }
}
