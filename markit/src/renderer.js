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
const appendNode = (parentElement, name) => {
  let li = document.createElement("li");
  li.appendChild(document.createTextNode(name));
  parentElement.appendChild(li);
  return li;
};

const showFileTree = (filePath) => {
  let name = path.parse(filePath).base;
  parent = appendNode(tree, name);

  let state = fs.statSync(filePath);
  if (state.isDirectory()) {
    parent.className += "folder";
    let ul = document.createElement("ul");
    parent.appendChild(ul);

    fs.readdirSync(filePath).forEach((f) => {
      let name = path.parse(f).base;
      let el = appendNode(ul, name);

      if (fs.statSync(f).isDirectory()) {
        el.className = "folder"
      }else{
        el.className = "file"
      }
    });
  }else{
    parent.className += "file";
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
  showFileTree(filePath);
});
