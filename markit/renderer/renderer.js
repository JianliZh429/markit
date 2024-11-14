const { marked } = require("marked");
const markedCodePreview = require("marked-code-preview");
const { markedEmoji } = require("marked-emoji");
const { baseUrl } = require("marked-base-url");
const { Octokit } = require("@octokit/rest");

const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

let isEditMode = false;
let $selected = null;

new Octokit().rest.emojis.get().then((res) => {
  marked
    .use({ gfm: true })
    .use(markedCodePreview())
    .use(
      markedEmoji({
        emojis: res.data,
        unicode: false,
      })
    );
});

const $explorer = document.getElementById("explorer");
const $editor = document.getElementById("editor");
const $previewer = document.getElementById("previewer");
const $tree = document.getElementById("tree");
const $title = document.querySelector("title");
const $searchInFile = document.getElementById("search");
const $searchInput = document.getElementById("search-input");
const $searchResult = document.getElementById("search-result");

const currentContent = () => {
  return isEditMode ? $editor.value : $previewer.innerHTML;
};

const previewMode = () => {
  const markdownContent = $editor.value;
  const htmlContent = marked.parse(markdownContent);
  $previewer.innerHTML = htmlContent;
  $previewer.style.display = "block";
  $editor.style.display = "none";
};

const editMode = () => {
  $previewer.style.display = "none";
  $editor.style.display = "block";
};

const loadFile = (filePath) => {
  marked.use(baseUrl(filePath));
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
  $ul = $li.getElementsByTagName("ul");
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
  changeSelected($li);
  loadFile(filePath);
  event.stopPropagation();
};

const folderDblClickListener = (event) => {
  let $li = event.target;
  const filePath = $li.dataset.fullPath;
  switchFolderState($li);
  let $ul = $li.getElementsByTagName("ul");
  if ($ul.length > 0) {
    $li.removeChild($ul[0]);
  } else {
    unfoldDir($li, filePath);
  }
  event.stopPropagation();
};

const appendNode = ($ul, filePath, isFile) => {
  let pasedPath = path.parse(filePath);
  let $li = document.createElement("li");
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
  $ul = getOrCreateChildUl($li);
  fs.readdirSync(filePath).forEach((f) => {
    let fPath = path.join(filePath, f);
    let parsedPath = path.parse(fPath);
    if (fs.statSync(fPath).isDirectory()) {
      appendNode($ul, fPath, false);
    } else if (parsedPath.ext.toLowerCase() == ".md") {
      appendNode($ul, fPath, true);
    }
  });
};

const showFileTree = ($root, filePath) => {
  let state = fs.statSync(filePath);
  if (state.isDirectory()) {
    let $parent = appendNode($root, filePath, false);
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

const findInFile = (searchTerm) => {
  const content = currentContent();
  const regex = new RegExp(searchTerm, "gi");
  const matches = content.match(regex);
  if (matches) {
    console.log(`Found ${matches.length} matches for "${searchTerm}"`);
    // Highlight matches in the editor
    const highlightedContent = content.replace(
      regex,
      (match) => `<mark>${match}</mark>`
    );
    $searchResult.innerHTML = highlightedContent;
    console.log("content: " + highlightedContent);
  } else {
    console.log(`No matches found for "${searchTerm}"`);
  }
};

$searchInput.addEventListener("keydown", (event) => {
  if (event.code !== "Enter") return;
  const searchTerm = event.target.value;
  findInFile(searchTerm);
});
ipcRenderer.on("toggle-mode", () => {
  isEditMode = !isEditMode;
  $searchInFile.style.display = "none";
  if (isEditMode) {
    editMode();
  } else {
    previewMode();
  }
});

ipcRenderer.on("select-all", () => {
  $editor.focus();
  $editor.select();
});

ipcRenderer.on("open-file-dialog", (event) => {
  ipcRenderer.send("open-file-dialog");
});

ipcRenderer.on("open-folder-dialog", (event) => {
  ipcRenderer.send("open-folder-dialog");
});

ipcRenderer.on("file-opened", (event, args) => {
  console.log("file-opened: ", args);
  let filePath = typeof args === "string" ? args : args[0];
  loadFileOrFolderToExplorer($tree, filePath);
});

ipcRenderer.on("save-opened-file", (event) => {
  const openedFilePath = $title.textContent;
  content = $editor.value;
  fs.stat(openedFilePath, (err, stat) => {
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

ipcRenderer.on("save-file-dialog", (event) => {
  ipcRenderer.send("save-file-dialog");
});

// Listen for save-file event
ipcRenderer.on("save-file", (event, filePath) => {
  // Handle the file save response from the main process
  ipcRenderer.send("save-file", filePath, $editor.value);
});

ipcRenderer.on("new-file-dialog", (event) => {
  ipcRenderer.send("new-file-dialog");
});

ipcRenderer.on("new-file-created", (event, filePath) => {
  createFile(filePath, (filePath) => {
    loadFile(filePath);
  });
});

ipcRenderer.on("toggle-explorer", () => {
  if ($explorer.style.display == "none") {
    $explorer.style.display = "block";
  } else {
    $explorer.style.display = "none";
  }
});

ipcRenderer.on("search-in-file", () => {
  if ($searchInFile.style.display == "none") {
    $searchInFile.style.display = "block";
    $searchInput.focus();
    $searchResult.innerHTML = currentContent();
    $previewer.style.display = "none";
    $editor.style.display = "none";
  } else {
    $searchInFile.style.display = "none";
    $previewer.style.display = "block";
    $editor.style.display = "none";
  }
});

ipcRenderer.send("open-recent-file");
