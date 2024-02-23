const { marked } = require("marked");
const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

let isEditMode = true;

const explorer = document.getElementById("explorer");
const editor = document.getElementById("editor");
const previewer = document.getElementById("previewer");
const tree = document.getElementById("tree");

const previewMode = () => {
  const markdownContent = editor.value;
  const htmlContent = marked(markdownContent);
  previewer.innerHTML = htmlContent;
  previewer.style.display = "block";
  editor.style.display = "none";
};

const editMode = () => {
  previewer.style.display = "none";
  editor.style.display = "block";
};

const loadFile = (filePath) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    editor.value = data;
    if (!isEditMode) {
      previewMode();
    }
  });
};

const appendNode = ($parenEl, filePath, isFile) => {
  let pasedPath = path.parse(filePath);
  let $li = document.createElement("li");
  $li.appendChild(document.createTextNode(pasedPath.base));
  $parenEl.appendChild($li);

  if (isFile) {
    $li.className += "file";
    $li.addEventListener("dblclick", () => {
      loadFile(filePath);
    });
  } else {
    $li.className += "folder";
    $li.addEventListener("dblclick", () => {
      let $ul = document.createElement("ul");
      $li.appendChild($ul);
      unfoldDir($ul, filePath);
    });
  }
  return $li;
}


const unfoldDir = ($el, filePath) => {
  fs.readdirSync(filePath).forEach((f) => {
    let fPath = path.join(filePath, f);
    let parsedPath = path.parse(fPath);
    if (fs.statSync(fPath).isDirectory()) {
      appendNode($el, fPath, false);
    } else if (parsedPath.ext.toLowerCase() == ".md") {
      appendNode($el, fPath, true);
    }
  });
};
const showFileTree = ($el, filePath) => {
  let state = fs.statSync(filePath);
  if (state.isDirectory()) {
    let parent = appendNode($el, filePath, false);
    let $ul = document.createElement("ul");
    parent.appendChild($ul);
    unfoldDir($ul, filePath);
  } else {
    appendNode($el, filePath, true);
  }
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
  tree.innerHTML = "";
  let filePath = args[0];
  if (fs.statSync(filePath).isFile()) {
    loadFile(filePath);
  }
  showFileTree(tree, filePath);
});
