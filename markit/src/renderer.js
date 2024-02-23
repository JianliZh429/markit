const { marked } = require("marked");
const { ipcRenderer } = require("electron");

const projectPane = document.getElementById("project-pane");
const markdownInput = document.getElementById("markdown-input");
const previewPane = document.getElementById("preview-pane");

const previewMode = () => {
  const markdownContent = markdownInput.value;
  const htmlContent = marked(markdownContent);
  previewPane.innerHTML = htmlContent;
  previewPane.style.display = "block";
  markdownInput.style.display = "none";
};
const editMode = () => {
  previewPane.style.display = "none";
  markdownInput.style.display = "block";
};
let isEditMode = true;
ipcRenderer.on("toggle-mode", () => {
  isEditMode = !isEditMode;
  if (isEditMode) {
    editMode();
  } else {
    previewMode();
  }
});
