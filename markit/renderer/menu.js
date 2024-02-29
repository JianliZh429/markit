const remote = require("@electron/remote");
const { Menu, MenuItem } = remote;
const moveCursorToEnd = ($li) => {
  const length = $li.innerHTML.length;
  const range = document.createRange();
  range.selectNode($li);
  range.setStart($li, 1);
  range.setEnd($li, 1);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  $li.selectionStart = $li.selectionEnd = length;
  $li.focus();
};

const renaming = ($li) => {
  $li.contentEditable = true;
  $li.style.border = "1px solid black";
  $li.style.cursor = "text";
  moveCursorToEnd($li);
  const preValue = $li.innerHTML;
  $li.addEventListener(
    "blur",
    (event) => {
      $li.contentEditable = false;
      $li.style.border = "none";
      event.preventDefault();

      const curValue = $li.innerHTML;
      if (curValue != preValue) {
        $li.className += " renamed";
        ipcRenderer.send("renamed", $li.dataset.fullPath, curValue);
      }
    },
    { once: true }
  );
  $li.addEventListener("keypress", function (event) {
    const activeElement = document.activeElement;
    if (event.key === "Enter" && activeElement == $li) {
      $li.blur();
      event.preventDefault();
    }
  });
};

const popupMenu = ($li) => {
  if ($li.tagName.toLowerCase() === "li") {
    const menu = new Menu();
    const menuRename = new MenuItem({
      label: "Rename",
      click: (event) => {
        renaming($li);
      },
    });
    menu.append(menuRename);

    const menuDelete = new MenuItem({
      label: "Delete",
      click: (event) => {
        console.log(event);
      },
    });
    menu.append(menuDelete);
    menu.popup(remote.getCurrentWindow());
  }
};

window.addEventListener(
  "contextmenu",
  (e) => {
    popupMenu(e.target);
    e.preventDefault();
  },
  false
);
