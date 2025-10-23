// Access electronAPI without redeclaring variables to avoid conflicts with renderer.js
const { showContextMenu: showMenu, on: onIpc, fs: fileSystem, path: pathUtil } = window.electronAPI;

const moveCursorToEnd = ($li) => {
  // Get the text node inside $li, if it exists
  const textNode = $li.firstChild;

  // If there is no text node or text is empty, return early
  if (!textNode || !textNode.textContent) return;

  const textContent = textNode.textContent;
  const textLength = textContent.length;

  // Check if the text ends with ".md", and set the position accordingly
  const position = textContent.endsWith(".md") ? textLength - 3 : textLength;

  // Create a new range and set it from the start to the calculated position
  const range = document.createRange();
  range.setStart(textNode, 0); // Start at the beginning of the text node
  range.setEnd(textNode, position); // End at the calculated position

  // Get the current selection and update it
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  // Focus on the element to make the cursor visible
  $li.focus();
};

const isFolder = ($el) => {
  return (
    $el.classList.contains("folder") || $el.classList.contains("folder-open")
  );
};

const newFile = ($li) => {
  if (!isFolder($li)) {
    $li = $li.parentNode.parentNode;
  }
  const filePath = $li.dataset.fullPath;
  if (!$li.classList.contains("folder-open")) {
    unfoldDir($li, filePath);
    switchFolderState($li);
  }

  const $newLi = document.createElement("li");
  $newLi.className += " file";
  $newLi.appendChild(document.createTextNode("untitled.md"));
  const newFilePath = pathUtil.join(filePath, "untitled.md");
  $newLi.dataset.fullPath = newFilePath;
  createFile(newFilePath);
  $newLi.addEventListener("dblclick", fileDblClickListener);

  const $ul = getOrCreateChildUl($li);
  $ul.appendChild($newLi);
  renaming($newLi, (originalPath, renamedFilePath) => {
    changeSelected($newLi);
    loadFile(renamedFilePath);
  });
};

const renaming = ($li, renamedCallback) => {
  $li.contentEditable = true;
  moveCursorToEnd($li);
  const preValue = $li.innerHTML;
  $li.addEventListener(
    "blur",
    (event) => {
      $li.contentEditable = false;
      const curValue = $li.innerHTML;

      if (curValue != preValue) {
        const preFilePath = $li.dataset.fullPath;
        const curFilePath = pathUtil.join(pathUtil.parse(preFilePath).dir, curValue);
        $li.dataset.fullPath = curFilePath;
        renamed(preFilePath, curFilePath, renamedCallback);
      }
      event.preventDefault();
    },
    { once: true },
  );
  $li.addEventListener("keypress", function (event) {
    const activeElement = document.activeElement;
    if (event.key === "Enter" && activeElement == $li) {
      $li.blur();
      event.preventDefault();
    }
  });
};

const renamed = (filePath, newPath, renamedCallback) => {
  fileSystem.stat(filePath, (err, stat) => {
    if (err) {
      fileSystem.open(newPath, "w", (err, file) => {
        if (err) {
          console.error(err);
        } else {
          if (renamedCallback instanceof Function) {
            renamedCallback(filePath, newPath);
          }
          console.log(`File "${newPath}" created`);
        }
      });
    } else {
      fileSystem.rename(filePath, newPath, (err) => {
        if (err) {
          console.error(err);
        } else {
          if (renamedCallback instanceof Function) {
            renamedCallback(filePath, newPath);
          }
          console.log(`File "${filePath}" is renamed to "${newPath}"`);
        }
      });
    }
  });
};

const deleting = ($li) => {
  const filePath = $li.dataset.fullPath;
  if (isFolder($li)) {
    fileSystem.rmdir(filePath, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Directory "${filePath}" is deleted.`);
      }
    });
  } else {
    fileSystem.unlink(filePath, (err) => {
      console.log(`Deleting "${filePath}"`);
      if (err) {
        console.error(err);
      } else {
        unloadFile(filePath);
        console.log(`File "${filePath}" is deleted.`);
      }
    });
  }
  $li.remove();
};

// Store the current context menu target
let contextMenuTarget = null;

const popupMenu = ($li) => {
  if ($li.tagName.toLowerCase() === "li") {
    contextMenuTarget = $li;
    
    const menuItems = [
      { id: "new-file", label: "New File" },
      { id: "rename", label: "Rename" },
      { id: "delete", label: "Delete" },
    ];
    
    showMenu(menuItems);
  }
};

// Listen for context menu command responses from main process
onIpc("context-menu-command", (commandId) => {
  if (!contextMenuTarget) return;
  
  const $li = contextMenuTarget;
  
  switch (commandId) {
  case "new-file":
    newFile($li);
    break;
  case "rename":
    renaming($li, (originalPath, newPath) => {
      if (originalPath == $title.textContent) {
        $title.textContent = newPath;
      }
    });
    break;
  case "delete":
    deleting($li);
    break;
  }
  
  contextMenuTarget = null;
});

window.addEventListener(
  "contextmenu",
  (e) => {
    popupMenu(e.target);
    e.preventDefault();
  },
  false,
);
