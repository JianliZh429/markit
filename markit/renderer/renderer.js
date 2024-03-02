const { marked } = require("marked");
const markedCodePreview = require("marked-code-preview");
const { markedEmoji } = require("marked-emoji");
const { baseUrl } = require("marked-base-url");
const { Octokit } = require("@octokit/rest");

const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

let isEditMode = true;
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

// const $explorer = document.getElementById("explorer");
const $editor = document.getElementById("editor");
const $previewer = document.getElementById("previewer");
const $tree = document.getElementById("tree");
const $title = document.querySelector("title");
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

const appendNode = ($ul, filePath, isFile) => {
  let pasedPath = path.parse(filePath);
  let $li = document.createElement("li");
  $li.appendChild(document.createTextNode(pasedPath.base));
  $li.dataset.fullPath = filePath;
  $ul.appendChild($li);

  if (isFile) {
    $li.className += " file";

    $li.addEventListener("dblclick", (event) => {
      changeSelected(event.target);
      loadFile(filePath);
      event.stopPropagation();
    });
  } else {
    $li.className += " folder";
    $li.addEventListener("dblclick", (event) => {
      let $target = event.target;
      switchFolderState($target);
      let $ul = $target.getElementsByTagName("ul");
      if ($ul.length > 0) {
        $target.removeChild($ul[0]);
      } else {
        let $ul2 = document.createElement("ul");
        $target.appendChild($ul2);
        unfoldDir($ul2, filePath);
      }
      event.stopPropagation();
    });
  }
  return $li;
};

const unfoldDir = ($ul, filePath) => {
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
    let $ul = document.createElement("ul");
    $parent.appendChild($ul);
    unfoldDir($ul, filePath);
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

ipcRenderer.on("toggle-mode", () => {
  isEditMode = !isEditMode;
  if (isEditMode) {
    editMode();
  } else {
    previewMode();
  }
});

ipcRenderer.on("open-file-directory-dialog", (event) => {
  ipcRenderer.send("open-file-directory-dialog");
});

ipcRenderer.on("file-opened", (event, args) => {
  let filePath = args[0];
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
