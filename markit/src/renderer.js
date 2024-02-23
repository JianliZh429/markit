const { marked } = require("marked");

const projectPane = document.getElementById("project-pane");
const markdownInput = document.getElementById("markdown-input");
const previewPane = document.getElementById("preview-pane");

markdownInput.addEventListener("input", () => {
  const markdownContent = markdownInput.value;
  const htmlContent = marked(markdownContent);
  previewPane.innerHTML = htmlContent;
});
