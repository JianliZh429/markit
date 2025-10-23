// Use the secure electronAPI exposed via preload script
const {
  send: ipcSend,
  on: ipcOn,
  fs,
  path,
  searchInFiles,
  parseMarkdown,
  setMarkdownBaseUrl,
} = window.electronAPI;

let isEditMode = false;
let $selected = null;
let editorScrollTop = 0;
let editorSelectionStart = 0;
let editorSelectionEnd = 0;
let previewScrollTop = 0;
let previewCursorOffset = 0;

const $explorer = document.getElementById("explorer");
const $editor = document.getElementById("editor");
const $previewer = document.getElementById("previewer");
const $tree = document.getElementById("tree");
const $title = document.querySelector("title");
const $localSearch = document.getElementById("local-search");
const $localSearchInput = document.getElementById("local-search-input");
const $localSearchResult = document.getElementById("local-search-result");
const $globalSearch = document.getElementById("global-search");
const $globalSearchInput = document.getElementById("global-search-input");
const $globalSearchResult = document.getElementById("global-search-result");

const rootDirectory = () => {
  return $tree.firstElementChild.dataset.fullPath;
};

const currentContent = () => {
  return isEditMode ? $editor.value : $previewer.innerHTML;
};

const previewMode = () => {
  // Save editor state before switching
  editorScrollTop = $editor.scrollTop;
  editorSelectionStart = $editor.selectionStart;
  editorSelectionEnd = $editor.selectionEnd;

  const markdownContent = $editor.value;
  const htmlContent = parseMarkdown(markdownContent);
  $previewer.innerHTML = htmlContent;
  $previewer.style.display = "block";
  $editor.style.display = "none";

  // Make previewer editable
  $previewer.contentEditable = "true";

  // Restore cursor position in preview mode
  setTimeout(() => {
    // Restore scroll position
    $previewer.scrollTop = previewScrollTop;

    // Try to restore cursor position based on character offset from editor
    try {
      const selection = window.getSelection();
      const walker = document.createTreeWalker(
        $previewer,
        NodeFilter.SHOW_TEXT,
        null,
        false,
      );

      let currentOffset = 0;
      let targetNode = null;
      let targetOffset = 0;

      // Find the text node at the saved cursor position
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeLength = node.textContent.length;

        if (currentOffset + nodeLength >= editorSelectionStart) {
          targetNode = node;
          targetOffset = editorSelectionStart - currentOffset;
          break;
        }

        currentOffset += nodeLength;
      }

      // Set cursor position if target node found
      if (targetNode) {
        const range = document.createRange();
        range.setStart(
          targetNode,
          Math.min(targetOffset, targetNode.textContent.length),
        );
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      $previewer.focus();
    } catch (e) {
      console.error("Error restoring cursor in preview:", e);
      $previewer.focus();
    }
  }, 0);
};

const editMode = () => {
  // Save preview state before switching
  previewScrollTop = $previewer.scrollTop;

  // Try to save cursor position from preview mode and map it to markdown source
  try {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const cursorNode = range.startContainer;
      const cursorOffset = range.startOffset;

      // Get the visible text offset in the preview (rendered HTML)
      const visibleOffset = getTextOffset($previewer, cursorNode, cursorOffset);

      // Now we need to map this visible text position to the markdown source position
      // Get the current markdown source
      const markdownSource = $editor.value;

      // Find the position in markdown that corresponds to this visible text position
      editorSelectionStart = mapPreviewOffsetToMarkdownOffset(
        markdownSource,
        visibleOffset,
      );
      editorSelectionEnd = editorSelectionStart;
    }
  } catch (e) {
    console.error("Error saving cursor from preview:", e);
  }

  // Disable previewer editing when switching to edit mode
  $previewer.contentEditable = "false";

  $previewer.style.display = "none";
  $editor.style.display = "block";

  // Restore editor state after switching
  setTimeout(() => {
    $editor.scrollTop = editorScrollTop;
    $editor.setSelectionRange(editorSelectionStart, editorSelectionEnd);
    $editor.focus();
  }, 0);
};
const hideLocalSearch = () => {
  $localSearch.style.display = "none";
};

const hideGlobalSearch = () => {
  $globalSearch.style.display = "none";
  $globalSearchResult.style.display = "none";
};

const isGlobalSearchOn = () => {
  return (
    $globalSearch.style.display !== "none" ||
    $globalSearchResult.style.display !== "none"
  );
};

const loadFile = (filePath) => {
  setMarkdownBaseUrl(filePath);
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    $editor.value = data;
    if (!isEditMode) {
      previewMode();
    }
    $title.textContent = filePath;
  });
};

const unloadFile = (filePath) => {
  if ($title.textContent === filePath) {
    $title.textContent = "Markdown Editor";
    $editor.value = "";
    if (!isEditMode) {
      previewMode();
    }
  }
};

const switchFolderState = ($li) => {
  if ($li.classList.contains("folder-open")) {
    $li.classList.remove("folder-open");
    $li.className += " folder";
  } else {
    $li.classList.remove("folder");
    $li.className += " folder-open";
  }
};

const changeSelected = ($target) => {
  if ($selected) {
    $selected.classList.remove("selected");
  }
  $target.className += " selected";
  $selected = $target;
};

const getOrCreateChildUl = ($li) => {
  let $ul = $li.getElementsByTagName("ul");
  if ($ul.length > 0) {
    return $ul[0];
  }
  $ul = document.createElement("ul");
  $li.appendChild($ul);
  return $ul;
};

const fileDblClickListener = (event) => {
  const $li = event.target;
  const filePath = $li.dataset.fullPath;
  hideLocalSearch();
  hideGlobalSearch();
  changeSelected($li);
  loadFile(filePath);
  event.stopPropagation();
};

const folderDblClickListener = (event) => {
  const $li = event.target;
  const filePath = $li.dataset.fullPath;
  switchFolderState($li);
  const $ul = $li.getElementsByTagName("ul");
  if ($ul.length > 0) {
    $li.removeChild($ul[0]);
  } else {
    unfoldDir($li, filePath);
  }
  event.stopPropagation();
};

const appendNode = ($ul, filePath, isFile) => {
  const pasedPath = path.parse(filePath);
  const $li = document.createElement("li");
  $li.appendChild(document.createTextNode(pasedPath.base));
  $li.dataset.fullPath = filePath;
  $ul.appendChild($li);

  if (isFile) {
    $li.className += " file";
    $li.addEventListener("dblclick", fileDblClickListener);
  } else {
    $li.className += " folder";
    $li.addEventListener("dblclick", folderDblClickListener);
  }
  return $li;
};

const unfoldDir = ($li, filePath) => {
  const $ul = getOrCreateChildUl($li);
  fs.readdirSync(filePath).forEach((f) => {
    const fPath = path.join(filePath, f);
    const parsedPath = path.parse(fPath);
    if (fs.statSync(fPath).isDirectory()) {
      appendNode($ul, fPath, false);
    } else if (parsedPath.ext.toLowerCase() == ".md") {
      appendNode($ul, fPath, true);
    }
  });
};

const showFileTree = ($root, filePath) => {
  const state = fs.statSync(filePath);
  if (state.isDirectory()) {
    const $parent = appendNode($root, filePath, false);
    unfoldDir($parent, filePath);
    switchFolderState($parent);
  } else {
    appendNode($root, filePath, true);
  }
};

const loadFileOrFolderToExplorer = ($tree, filePath) => {
  $tree.innerHTML = "";
  if (fs.statSync(filePath).isFile()) {
    loadFile(filePath);
  }
  showFileTree($tree, filePath);
};

const createFile = (filePath, fileCreated) => {
  fs.open(filePath, "w", (err) => {
    if (err) {
      console.error(err);
    } else {
      if (fileCreated instanceof Function) {
        loadFile(filePath);
      }
      console.log(`File ${filePath} saved successfully`);
    }
  });
};

const localSearch = (searchTerm) => {
  hideGlobalSearch();
  const content = currentContent();
  const regex = new RegExp(searchTerm, "gi");
  const matches = content.match(regex);
  if (matches) {
    console.log(`Found ${matches.length} matches for "${searchTerm}"`);
    // Highlight matches in the editor
    const highlightedContent = content.replace(
      regex,
      (match) => `<mark>${match}</mark>`,
    );
    $localSearchResult.innerHTML = highlightedContent;
    console.log("content: " + highlightedContent);
  } else {
    console.log(`No matches found for "${searchTerm}"`);
  }
};

$localSearchInput.addEventListener("keydown", (event) => {
  if (event.code !== "Enter") return;
  const searchTerm = event.target.value;
  localSearch(searchTerm);
});

const globalSearch = async (keyword) => {
  hideLocalSearch();
  const results = await searchInFiles(rootDirectory(), keyword);
  console.log("results: ", results);
  $globalSearchResult.innerHTML = results
    .map(
      (result) => `
        <div>
            <h3>${result.file}</h3>
            ${result.matches.map((match) => `<p>...${match.snippet}...</p>`).join("")}
        </div>
    `,
    )
    .join("");
  $globalSearchResult.style.display = "block";
};

$globalSearchInput.addEventListener("keydown", async (event) => {
  if (event.code !== "Enter") return;
  const keyword = event.target.value;
  await globalSearch(keyword);
});

ipcOn("toggle-mode", () => {
  isEditMode = !isEditMode;
  $localSearch.style.display = "none";
  if (isEditMode) {
    editMode();
  } else {
    previewMode();
  }
});

ipcOn("select-all", () => {
  $editor.focus();
  $editor.select();
});

ipcOn("open-file-dialog", () => {
  ipcSend("open-file-dialog");
});

ipcOn("open-folder-dialog", () => {
  ipcSend("open-folder-dialog");
});

ipcOn("file-opened", (args) => {
  console.log("file-opened: ", args);
  const filePath = typeof args === "string" ? args : args[0];
  loadFileOrFolderToExplorer($tree, filePath);
});

ipcOn("save-opened-file", () => {
  const openedFilePath = $title.textContent;
  const content = $editor.value;
  fs.stat(openedFilePath, (err, _stat) => {
    if (!err) {
      fs.writeFile(openedFilePath, content, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`File ${openedFilePath} saved successfully`);
        }
      });
    }
  });
});

ipcOn("save-file-dialog", () => {
  ipcSend("save-file-dialog");
});

// Listen for save-file event
ipcOn("save-file", (filePath) => {
  // Handle the file save response from the main process
  ipcSend("save-file", filePath, $editor.value);
});

ipcOn("new-file-dialog", () => {
  ipcSend("new-file-dialog");
});

ipcOn("new-file-created", (filePath) => {
  createFile(filePath, (filePath) => {
    loadFile(filePath);
  });
});

ipcOn("toggle-explorer", () => {
  if ($explorer.style.display == "none") {
    $explorer.style.display = "block";
  } else {
    $explorer.style.display = "none";
  }
});

ipcOn("local-search", () => {
  if ($localSearch.style.display == "none") {
    $localSearch.style.display = "block";
    $localSearchInput.focus();
    $localSearchResult.innerHTML = currentContent();
    $previewer.style.display = "none";
    $editor.style.display = "none";
    hideGlobalSearch();
  } else {
    $localSearch.style.display = "none";
    $previewer.style.display = "block";
    $editor.style.display = "none";
  }
});

ipcOn("global-search", () => {
  if (isGlobalSearchOn()) {
    hideGlobalSearch();
    $previewer.style.display = "block";
    $editor.style.display = "none";
  } else {
    $globalSearch.style.display = "block";
    $globalSearchInput.focus();
    $globalSearchResult.innerHTML = currentContent();
    $previewer.style.display = "none";
    $editor.style.display = "none";
  }
});

// Handle paste with styles - convert HTML to Markdown (for editor)
$editor.addEventListener("paste", (event) => {
  // Get clipboard data
  const clipboardData = event.clipboardData || window.clipboardData;
  const htmlData = clipboardData.getData("text/html");
  const plainText = clipboardData.getData("text/plain");

  // If there's HTML data, convert it to Markdown
  if (htmlData) {
    event.preventDefault();

    // Convert HTML to Markdown
    const markdown = htmlToMarkdown(htmlData);

    // Insert at cursor position
    const start = $editor.selectionStart;
    const end = $editor.selectionEnd;
    const text = $editor.value;

    $editor.value = text.substring(0, start) + markdown + text.substring(end);

    // Set cursor position after inserted text
    const newPosition = start + markdown.length;
    $editor.setSelectionRange(newPosition, newPosition);

    // Update preview if in preview mode
    if (!isEditMode) {
      previewMode();
    }
  }
  // Otherwise, let the default paste behavior handle plain text
});

// Handle paste in preview mode
$previewer.addEventListener("paste", (event) => {
  event.preventDefault();

  // Get clipboard data
  const clipboardData = event.clipboardData || window.clipboardData;
  const htmlData = clipboardData.getData("text/html");
  const plainText = clipboardData.getData("text/plain");

  // Convert HTML to Markdown or use plain text
  const markdown = htmlData ? htmlToMarkdown(htmlData) : plainText;

  // Append to editor content
  $editor.value += "\n\n" + markdown;

  // Update preview to show the new content
  previewMode();

  // Scroll to bottom to show the newly pasted content
  setTimeout(() => {
    $previewer.scrollTop = $previewer.scrollHeight;
  }, 0);
});

// Convert HTML to Markdown
function htmlToMarkdown(html) {
  // Create a temporary div to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = html;

  return processNode(temp);
}

function processNode(node) {
  let markdown = "";

  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      markdown += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();

      switch (tag) {
        case "table":
          markdown += convertTableToMarkdown(child);
          break;
        case "h1":
          markdown += `# ${processNode(child)}\n\n`;
          break;
        case "h2":
          markdown += `## ${processNode(child)}\n\n`;
          break;
        case "h3":
          markdown += `### ${processNode(child)}\n\n`;
          break;
        case "h4":
          markdown += `#### ${processNode(child)}\n\n`;
          break;
        case "h5":
          markdown += `##### ${processNode(child)}\n\n`;
          break;
        case "h6":
          markdown += `###### ${processNode(child)}\n\n`;
          break;
        case "strong":
        case "b":
          markdown += `**${processNode(child)}**`;
          break;
        case "em":
        case "i":
          markdown += `*${processNode(child)}*`;
          break;
        case "code":
          markdown += `\`${processNode(child)}\``;
          break;
        case "pre":
          markdown += `\n\`\`\`\n${processNode(child)}\n\`\`\`\n\n`;
          break;
        case "a":
          const href = child.getAttribute("href") || "";
          markdown += `[${processNode(child)}](${href})`;
          break;
        case "img":
          const src = child.getAttribute("src") || "";
          const alt = child.getAttribute("alt") || "";
          markdown += `![${alt}](${src})`;
          break;
        case "ul":
          markdown += `\n${processNode(child)}\n`;
          break;
        case "ol":
          markdown += `\n${processNode(child)}\n`;
          break;
        case "li":
          // Check if parent is ul or ol
          const parentTag = child.parentElement?.tagName.toLowerCase();
          if (parentTag === "ol") {
            markdown += `1. ${processNode(child)}\n`;
          } else {
            markdown += `- ${processNode(child)}\n`;
          }
          break;
        case "blockquote":
          markdown += `> ${processNode(child).split("\n").join("\n> ")}\n\n`;
          break;
        case "p":
          markdown += `${processNode(child)}\n\n`;
          break;
        case "br":
          markdown += "\n";
          break;
        case "hr":
          markdown += "\n---\n\n";
          break;
        case "del":
        case "s":
        case "strike":
          markdown += `~~${processNode(child)}~~`;
          break;
        default:
          markdown += processNode(child);
      }
    }
  }

  return markdown;
}

// Convert HTML table to Markdown table
function convertTableToMarkdown(tableElement) {
  const rows = [];
  let maxColumns = 0;

  // Process all rows (thead, tbody, or direct tr elements)
  const allRows = tableElement.querySelectorAll("tr");

  allRows.forEach((tr, rowIndex) => {
    const cells = [];
    const cellElements = tr.querySelectorAll("th, td");

    cellElements.forEach((cell) => {
      // Get cell content and clean it up
      const content = processNode(cell).trim().replace(/\n/g, " ");
      cells.push(content);
    });

    if (cells.length > maxColumns) {
      maxColumns = cells.length;
    }

    rows.push(cells);
  });

  if (rows.length === 0) {
    return "";
  }

  // Build markdown table
  let markdown = "\n";

  // Add header row (first row becomes header)
  const headerRow = rows[0];
  while (headerRow.length < maxColumns) {
    headerRow.push("");
  }
  markdown += "| " + headerRow.join(" | ") + " |\n";

  // Add separator row
  markdown += "|" + " --- |".repeat(maxColumns) + "\n";

  // Add data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    while (row.length < maxColumns) {
      row.push("");
    }
    markdown += "| " + row.join(" | ") + " |\n";
  }

  markdown += "\n";

  return markdown;
}

// Real-time markdown preview in editable preview mode
let previewUpdateTimeout;
$previewer.addEventListener("input", () => {
  if (!isEditMode) {
    // Clear existing timeout
    clearTimeout(previewUpdateTimeout);

    // Save cursor position
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const cursorOffset = range ? range.startOffset : 0;
    const cursorNode = range ? range.startContainer : null;

    // Get the plain text content from previewer
    const plainText = $previewer.innerText || $previewer.textContent;

    // Update the underlying editor
    $editor.value = plainText;

    // Debounce the markdown parsing to avoid excessive re-renders
    previewUpdateTimeout = setTimeout(() => {
      const htmlContent = parseMarkdown(plainText);

      // Only update if content actually changed
      if ($previewer.innerHTML !== htmlContent) {
        $previewer.innerHTML = htmlContent;

        // Try to restore cursor position
        try {
          if (cursorNode && selection) {
            // Find the text node at similar position
            const walker = document.createTreeWalker(
              $previewer,
              NodeFilter.SHOW_TEXT,
              null,
              false,
            );

            let currentOffset = 0;
            let targetNode = null;
            let targetOffset = 0;

            // Calculate total offset to cursor
            const totalOffset = getTextOffset(
              $previewer,
              cursorNode,
              cursorOffset,
            );

            // Find the node at that offset
            while (walker.nextNode()) {
              const node = walker.currentNode;
              const nodeLength = node.textContent.length;

              if (currentOffset + nodeLength >= totalOffset) {
                targetNode = node;
                targetOffset = totalOffset - currentOffset;
                break;
              }

              currentOffset += nodeLength;
            }

            // Restore cursor if target found
            if (targetNode) {
              const newRange = document.createRange();
              newRange.setStart(
                targetNode,
                Math.min(targetOffset, targetNode.textContent.length),
              );
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        } catch (e) {
          console.error("Error restoring cursor:", e);
        }
      }
    }, 300); // 300ms debounce
  }
});

// Helper function to get text offset from container to node
function getTextOffset(container, targetNode, offset) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false,
  );

  let totalOffset = 0;
  let node;

  while ((node = walker.nextNode())) {
    if (node === targetNode) {
      return totalOffset + offset;
    }
    totalOffset += node.textContent.length;
  }

  return totalOffset;
}

// Map preview text offset to markdown source offset
function mapPreviewOffsetToMarkdownOffset(markdownSource, previewOffset) {
  // Parse the markdown to HTML to understand the mapping
  const renderedHTML = parseMarkdown(markdownSource);

  // Create a temporary container to get the rendered text
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = renderedHTML;
  const renderedText = tempDiv.innerText || tempDiv.textContent;

  // If preview offset is beyond rendered text, return end of markdown
  if (previewOffset >= renderedText.length) {
    return markdownSource.length;
  }

  // Strategy: Find the character at previewOffset in rendered text,
  // then find where that character appears in the markdown source

  // Get a substring around the target position for better matching
  const contextLength = 20;
  const startPos = Math.max(0, previewOffset - contextLength);
  const endPos = Math.min(renderedText.length, previewOffset + contextLength);
  const contextBefore = renderedText.substring(startPos, previewOffset);
  const contextAfter = renderedText.substring(previewOffset, endPos);

  // Try to find this context in the markdown source
  // First, try exact match of the context
  let searchText = contextBefore + contextAfter;
  let markdownPos = markdownSource.indexOf(searchText);

  if (markdownPos !== -1) {
    // Found exact match, return position adjusted by context before
    return markdownPos + contextBefore.length;
  }

  // If exact match fails, try with just the context before
  if (contextBefore.length > 0) {
    markdownPos = markdownSource.indexOf(contextBefore);
    if (markdownPos !== -1) {
      return markdownPos + contextBefore.length;
    }
  }

  // If that fails, try context after
  if (contextAfter.length > 0) {
    markdownPos = markdownSource.indexOf(contextAfter);
    if (markdownPos !== -1) {
      return markdownPos;
    }
  }

  // If all else fails, try to approximate by character ratio
  // This handles cases where markdown syntax affects positioning
  const ratio = previewOffset / renderedText.length;
  return Math.floor(markdownSource.length * ratio);
}

// Handle Enter key in preview mode to maintain formatting
$previewer.addEventListener("keydown", (event) => {
  if (!isEditMode && event.key === "Enter") {
    event.preventDefault();

    // Insert line break and trigger input event
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    const br = document.createTextNode("\n");
    range.deleteContents();
    range.insertNode(br);

    // Move cursor after the line break
    range.setStartAfter(br);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Trigger input event for update
    $previewer.dispatchEvent(new Event("input"));
  }
});

ipcSend("open-recent-file");
