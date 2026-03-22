/**
 * Editor Module
 * Handles markdown editor functionality
 */

import { stateManager } from "../state.js";
import { MarkdownService } from "../services/markdownService.js";
import { FileService } from "../services/fileService.js";

export class EditorModule {
  private editorElement: HTMLTextAreaElement;
  private markdownService: MarkdownService;
  private fileService: FileService | null = null;
  private currentFilePath: string | null = null;
  private folderRoot: string | null = null;
  private imageApi: { save: (dataUrl: string, filePath: string) => Promise<boolean> } | null = null;

  constructor(
    editorElement: HTMLTextAreaElement,
    markdownService: MarkdownService,
    fileService?: FileService,
    imageApi?: { save: (dataUrl: string, filePath: string) => Promise<boolean> },
  ) {
    this.editorElement = editorElement;
    this.markdownService = markdownService;
    if (fileService) {
      this.fileService = fileService;
    }
    if (imageApi) {
      this.imageApi = imageApi;
    }
    this.setupEventListeners();
  }

  /**
   * Set the current file path for image drop handling
   */
  public setCurrentFilePath(filePath: string | null): void {
    this.currentFilePath = filePath;
  }

  /**
   * Set the folder root for image drop handling (used when no file is open)
   */
  public setFolderRoot(root: string | null): void {
    this.folderRoot = root;
  }

  /**
   * Setup drag and drop event listeners for image files
   */
  private setupDragAndDrop(): void {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.editorElement.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    // Add visual feedback
    this.editorElement.addEventListener('dragenter', () => {
      this.editorElement.classList.add('drag-over');
    });

    this.editorElement.addEventListener('dragleave', () => {
      this.editorElement.classList.remove('drag-over');
    });

    // Handle drop
    this.editorElement.addEventListener('drop', (e) => {
      this.editorElement.classList.remove('drag-over');
      this.handleDrop(e);
    });
  }

  /**
   * Handle dropped files
   */
  private async handleDrop(e: DragEvent): Promise<void> {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await this.handleImageDrop(file);
      }
    }
  }

  /**
   * Handle dropped image file
   */
  private async handleImageDrop(file: File): Promise<void> {
    // Determine the base directory for saving images
    let baseDir: string | null = null;
    let markdownPath: string = '';

    if (this.currentFilePath && this.fileService) {
      const path = this.fileService.path;
      const fileDir = path.dirname(this.currentFilePath);

      // Images are saved in the same directory as the file
      baseDir = fileDir;
      markdownPath = '.assets';
    } else if (this.folderRoot && this.fileService) {
      // Fallback to folder root if no file is open
      baseDir = this.folderRoot;
      markdownPath = '.assets';
    }

    if (!baseDir) {
      // Fallback: insert file path
      this.insertText(`![${file.name}](file://${file.name})\n`);
      return;
    }

    try {
      const path = this.fileService!.path;

      // Generate unique filename
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const newFileName = `${timestamp}-${safeName}`;

      // Build full file path for saving
      const newFilePath = path.join(baseDir, markdownPath, newFileName);

      // Build markdown path (always use forward slashes)
      const markdownImagePath = `${markdownPath}/${newFileName}`;

      // Read the file as data URL
      const dataUrl = await this.readFileAsDataURL(file);

      // Save the image file via IPC
      let saved = false;
      if (this.imageApi) {
        saved = await this.imageApi.save(dataUrl, newFilePath);
      }

      // Insert the markdown reference
      const markdown = `![${file.name}](${markdownImagePath})\n\n`;
      this.insertText(markdown);

      if (!saved) {
        console.warn('Image saved locally but not via IPC:', file.name);
      }
    } catch (error) {
      console.error('Error handling image drop:', error);
      this.insertText(`![${file.name}](file://${file.name})\n`);
    }
  }

  /**
   * Read file as data URL
   */
  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Insert text at cursor position
   */
  private insertText(text: string): void {
    this.editorElement.focus();
    
    const start = this.editorElement.selectionStart;
    const end = this.editorElement.selectionEnd;
    const content = this.editorElement.value;

    this.editorElement.value = content.substring(0, start) + text + content.substring(end);
    
    const newPosition = start + text.length;
    this.editorElement.setSelectionRange(newPosition, newPosition);
    
    // Trigger input event for undo tracking and preview update
    this.editorElement.dispatchEvent(new InputEvent('input', {
      inputType: 'insertText',
      data: text,
      bubbles: true,
      cancelable: true
    }));
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

    // Handle drag and drop for images
    this.setupDragAndDrop();
  }

  private async handlePaste(event: ClipboardEvent): Promise<void> {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const htmlData = clipboardData.getData("text/html");
    const plainText = clipboardData.getData("text/plain");

    if (htmlData) {
      event.preventDefault();

      // Convert HTML to Markdown (async for large content)
      const markdown = await this.markdownService.htmlToMarkdown(htmlData);

      // Use execCommand for proper undo support
      // This ensures CMD+Z works correctly
      document.execCommand('insertText', false, markdown);
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
    // Also scroll to make the line visible
    this.scrollToLine(line);
  }

  /**
   * Scroll to specific line without changing cursor position
   */
  scrollToLine(line: number): void {
    const lineHeight = this.getLineHeight();
    const targetY = line * lineHeight;
    
    // Scroll to bring the line into view
    this.editorElement.scrollTop = targetY - (this.editorElement.clientHeight / 2) + (lineHeight / 2);
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
