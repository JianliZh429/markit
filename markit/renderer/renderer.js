// Use the secure electronAPI exposed via preload script  
const { send: ipcSend, on: ipcOn, fs, path, searchInFiles, parseMarkdown, setMarkdownBaseUrl } = window.electronAPI;

let isEditMode = false;
let $selected = null;

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
  const markdownContent = $editor.value;
  const htmlContent = parseMarkdown(markdownContent);
  $previewer.innerHTML = htmlContent;
  $previewer.style.display = "block";
  $editor.style.display = "none";
};

const editMode = () => {
  $previewer.style.display = "none";
  $editor.style.display = "block";
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
  $ul = getOrCreateChildUl($li);
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

ipcSend("open-recent-file");
