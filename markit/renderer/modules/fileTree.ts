/**
 * File Tree Module
 * Handles file tree rendering, navigation, and context menu operations
 */

import { FileService } from "../services/fileService.js";

export interface FileTreeOptions {
  fileService: FileService;
  onFileSelect: (filePath: string) => void;
  onFileCreate: (filePath: string) => void;
  onFileUnload: (filePath: string) => void;
  getCurrentTitle: () => string;
  setTitle: (title: string) => void;
}

export class FileTreeModule {
  private fileService: FileService;
  private $tree: HTMLUListElement;
  private $selected: HTMLLIElement | null = null;
  private contextMenuTarget: HTMLLIElement | null = null;
  private onFileSelectCallback: (filePath: string) => void;
  private onFileCreateCallback: (filePath: string) => void;
  private onFileUnloadCallback: (filePath: string) => void;
  private getCurrentTitleCallback: () => string;
  private setTitleCallback: (title: string) => void;

  constructor(treeElement: HTMLUListElement, options: FileTreeOptions) {
    this.fileService = options.fileService;
    this.$tree = treeElement;
    this.onFileSelectCallback = options.onFileSelect;
    this.onFileCreateCallback = options.onFileCreate;
    this.onFileUnloadCallback = options.onFileUnload;
    this.getCurrentTitleCallback = options.getCurrentTitle;
    this.setTitleCallback = options.setTitle;

    this.setupContextMenu();
  }

  /**
   * Get root directory path from tree
   */
  public getRootDirectory(): string {
    return (
      (this.$tree.firstElementChild as HTMLLIElement)?.dataset.fullPath || ""
    );
  }

  /**
   * Load file or folder to explorer
   */
  public loadFileOrFolder(filePath: string): void {
    this.$tree.innerHTML = "";
    if (this.fileService.isFile(filePath)) {
      this.onFileSelectCallback(filePath);
    }
    this.showFileTree(this.$tree, filePath);
  }

  /**
   * Clear the tree
   */
  public clear(): void {
    this.$tree.innerHTML = "";
    this.$selected = null;
  }

  /**
   * Change selected file in tree
   */
  private changeSelected($target: HTMLLIElement): void {
    if (this.$selected) {
      this.$selected.classList.remove("selected");
    }
    $target.classList.add("selected");
    this.$selected = $target;
  }

  /**
   * Switch folder open/closed state
   */
  private switchFolderState($li: HTMLLIElement): void {
    if ($li.classList.contains("folder-open")) {
      $li.classList.remove("folder-open");
      $li.classList.add("folder");
    } else {
      $li.classList.remove("folder");
      $li.classList.add("folder-open");
    }
  }

  /**
   * Get or create child ul element
   */
  private getOrCreateChildUl($li: HTMLLIElement): HTMLUListElement {
    let $ul = $li.getElementsByTagName("ul")[0];
    if ($ul) {
      return $ul;
    }
    $ul = document.createElement("ul");
    $li.appendChild($ul);
    return $ul;
  }

  /**
   * File double-click listener
   */
  private fileDblClickListener = (event: Event): void => {
    const $li = event.target as HTMLLIElement;
    const filePath = $li.dataset.fullPath!;
    this.changeSelected($li);
    this.onFileSelectCallback(filePath);
    event.stopPropagation();
  };

  /**
   * Folder double-click listener
   */
  private folderDblClickListener = (event: Event): void => {
    const $li = event.target as HTMLLIElement;
    const filePath = $li.dataset.fullPath!;
    this.switchFolderState($li);
    const $ul = $li.getElementsByTagName("ul")[0];
    if ($ul) {
      $li.removeChild($ul);
    } else {
      this.unfoldDir($li, filePath);
    }
    event.stopPropagation();
  };

  /**
   * Append a node to the tree
   */
  private appendNode(
    $ul: HTMLUListElement,
    filePath: string,
    isFile: boolean,
  ): HTMLLIElement {
    const parsedPath = this.fileService.parsePath(filePath);
    const $li = document.createElement("li");
    $li.appendChild(document.createTextNode(parsedPath.base));
    $li.dataset.fullPath = filePath;
    $ul.appendChild($li);

    if (isFile) {
      $li.classList.add("file");
      $li.addEventListener("dblclick", this.fileDblClickListener);
    } else {
      $li.classList.add("folder");
      $li.addEventListener("dblclick", this.folderDblClickListener);
    }
    return $li;
  }

  /**
   * Unfold a directory
   */
  private unfoldDir($li: HTMLLIElement, filePath: string): void {
    const $ul = this.getOrCreateChildUl($li);
    const files = this.fileService.listDirectory(filePath);

    files.forEach((fPath) => {
      const parsedPath = this.fileService.parsePath(fPath);
      if (this.fileService.isDirectory(fPath)) {
        this.appendNode($ul, fPath, false);
      } else if (parsedPath.ext.toLowerCase() === ".md") {
        this.appendNode($ul, fPath, true);
      }
    });
  }

  /**
   * Show file tree
   */
  private showFileTree($root: HTMLUListElement, filePath: string): void {
    if (this.fileService.isDirectory(filePath)) {
      const $parent = this.appendNode($root, filePath, false);
      this.unfoldDir($parent, filePath);
      this.switchFolderState($parent);
    } else {
      this.appendNode($root, filePath, true);
    }
  }

  // Context Menu Methods

  /**
   * Check if element is a folder
   */
  private isFolder($el: HTMLElement): boolean {
    return (
      $el.classList.contains("folder") || $el.classList.contains("folder-open")
    );
  }

  /**
   * Move cursor to end of text (before .md extension)
   */
  private moveCursorToEnd($li: HTMLLIElement): void {
    const textNode = $li.firstChild as Text;
    if (!textNode || !textNode.textContent) return;

    const textContent = textNode.textContent;
    const textLength = textContent.length;
    const position = textContent.endsWith(".md") ? textLength - 3 : textLength;

    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, position);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    $li.focus();
  }

  /**
   * Reorder siblings alphabetically
   */
  private reorderSiblings($li: HTMLLIElement): void {
    const $parent = $li.parentElement;
    if (!$parent) return;

    const $siblings = Array.from($parent.children) as HTMLLIElement[];
    $siblings.sort((a, b) => {
      const aText = (a.textContent || "").toLowerCase();
      const bText = (b.textContent || "").toLowerCase();
      return aText.localeCompare(bText);
    });

    $siblings.forEach(($sibling) => $parent.appendChild($sibling));
    $li.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /**
   * Create a new file
   */
  private async createNewFile($li: HTMLLIElement): Promise<void> {
    let targetLi = $li;
    if (!this.isFolder($li)) {
      const parent = $li.parentNode?.parentNode as HTMLLIElement;
      if (!parent) return;
      targetLi = parent;
    }

    const filePath = targetLi.dataset.fullPath;
    if (!filePath) return;

    if (!targetLi.classList.contains("folder-open")) {
      this.unfoldDir(targetLi, filePath);
      this.switchFolderState(targetLi);
    }

    const $newLi = document.createElement("li");
    $newLi.className = "file";
    $newLi.appendChild(document.createTextNode("untitled.md"));
    const newFilePath = this.fileService.joinPath(filePath, "untitled.md");
    $newLi.dataset.fullPath = newFilePath;

    try {
      await this.fileService.createFile(newFilePath);
      this.onFileCreateCallback(newFilePath);
    } catch (err) {
      console.error("Error creating file:", err);
      return;
    }

    $newLi.addEventListener("dblclick", this.fileDblClickListener);

    const $ul = this.getOrCreateChildUl(targetLi);
    $ul.appendChild($newLi);
    $newLi.scrollIntoView({ behavior: "smooth", block: "nearest" });

    this.startRenaming($newLi, (_originalPath, renamedFilePath) => {
      this.changeSelected($newLi);
      this.onFileSelectCallback(renamedFilePath);
    });
  }

  /**
   * Start renaming a file/folder
   */
  private startRenaming(
    $li: HTMLLIElement,
    callback?: (originalPath: string, newPath: string) => void,
  ): void {
    $li.contentEditable = "true";
    this.moveCursorToEnd($li);
    const preValue = $li.innerHTML;

    const blurHandler = async (): Promise<void> => {
      $li.contentEditable = "false";
      const curValue = $li.innerHTML;

      if (curValue !== preValue) {
        const preFilePath = $li.dataset.fullPath;
        if (!preFilePath) return;

        const parsedPath = this.fileService.parsePath(preFilePath);
        const curFilePath = this.fileService.joinPath(parsedPath.dir, curValue);
        $li.dataset.fullPath = curFilePath;

        await this.performRename(preFilePath, curFilePath, callback);
        this.reorderSiblings($li);
      }
    };

    const keypressHandler = (event: KeyboardEvent): void => {
      if (event.key === "Enter" && document.activeElement === $li) {
        $li.blur();
        event.preventDefault();
      }
    };

    $li.addEventListener("blur", blurHandler, { once: true });
    $li.addEventListener("keypress", keypressHandler);
  }

  /**
   * Perform file/folder rename
   */
  private async performRename(
    oldPath: string,
    newPath: string,
    callback?: (originalPath: string, newPath: string) => void,
  ): Promise<void> {
    try {
      const exists = await this.fileService.fileExists(oldPath);

      if (!exists) {
        // File doesn't exist, create it
        await this.fileService.createFile(newPath);
        console.log(`File "${newPath}" created`);
      } else {
        // File exists, rename it
        await this.fileService.renameFile(oldPath, newPath);
        console.log(`File "${oldPath}" renamed to "${newPath}"`);

        // Update title if renamed file is currently open
        if (this.getCurrentTitleCallback() === oldPath) {
          this.setTitleCallback(newPath);
        }
      }

      if (callback) {
        callback(oldPath, newPath);
      }
    } catch (err) {
      console.error("Error renaming/creating file:", err);
    }
  }

  /**
   * Delete a file or folder
   */
  private async deleteFileOrFolder($li: HTMLLIElement): Promise<void> {
    const filePath = $li.dataset.fullPath;
    if (!filePath) return;

    try {
      if (this.isFolder($li)) {
        await this.fileService.deleteDirectory(filePath);
        console.log(`Directory "${filePath}" deleted`);
      } else {
        await this.fileService.deleteFile(filePath);
        console.log(`File "${filePath}" deleted`);
        this.onFileUnloadCallback(filePath);
      }
      $li.remove();
    } catch (err) {
      console.error("Error deleting file/folder:", err);
    }
  }

  /**
   * Show context menu
   */
  private showContextMenu($li: HTMLLIElement): void {
    if ($li instanceof HTMLLIElement) {
      this.contextMenuTarget = $li;

      const menuItems = [
        { id: "new-file", label: "New File" },
        { id: "rename", label: "Rename" },
        { id: "delete", label: "Delete" },
      ];

      const { showContextMenu } = window.electronAPI;
      showContextMenu(menuItems);
    }
  }

  /**
   * Handle context menu command
   */
  private async handleContextMenuCommand(commandId: string): Promise<void> {
    if (!this.contextMenuTarget) return;

    const $li = this.contextMenuTarget;

    switch (commandId) {
      case "new-file":
        await this.createNewFile($li);
        break;
      case "rename":
        this.startRenaming($li, (originalPath, newPath) => {
          if (originalPath === this.getCurrentTitleCallback()) {
            this.setTitleCallback(newPath);
          }
        });
        break;
      case "delete":
        await this.deleteFileOrFolder($li);
        break;
    }

    this.contextMenuTarget = null;
  }

  /**
   * Setup context menu listeners
   */
  private setupContextMenu(): void {
    // Listen for context menu events
    window.addEventListener(
      "contextmenu",
      (e) => {
        const target = e.target as HTMLElement;
        if (target instanceof HTMLLIElement && this.$tree.contains(target)) {
          this.showContextMenu(target);
          e.preventDefault();
        }
      },
      false,
    );

    // Listen for context menu command responses
    const { on: ipcOn } = window.electronAPI;
    ipcOn("context-menu-command", (commandId: string) => {
      this.handleContextMenuCommand(commandId);
    });
  }
}
