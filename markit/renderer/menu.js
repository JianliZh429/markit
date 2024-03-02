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
const isFolder = ($el) => {
  return (
    $el.classList.contains("folder") || $el.classList.contains("folder-open")
  );
};

const newFile = ($li) => {
  if (isFolder($li)) {
    const filePath = $li.dataset.fullPath;
    if (!$li.classList.contains("folder-open")) {
      unfoldDir($li, filePath);
      switchFolderState($li);
    }

    const $newLi = document.createElement("li");
    $newLi.className += " file";
    $newLi.appendChild(document.createTextNode("untitled.md"));
    const newFilePath = path.join(filePath, "untitled.md");
    $newLi.dataset.fullPath = newFilePath;

    const $ul = getOrCreateChildUl($li);
    $ul.appendChild($newLi);
    renaming($newLi);
  }
};

const renaming = ($li) => {
  $li.contentEditable = true;
  moveCursorToEnd($li);
  const preValue = $li.innerHTML;
  $li.addEventListener(
    "blur",
    (event) => {
      $li.contentEditable = false;
      event.preventDefault();

      const curValue = $li.innerHTML;
      if (curValue != preValue) {
        $li.className += " renamed";
        const preFilePath = $li.dataset.fullPath;
        const curFilePath = path.join(path.parse(preFilePath).dir, curValue);
        $li.dataset.fullPath = curFilePath;
        ipcRenderer.send("renamed", preFilePath, curFilePath);
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

const deleting = ($li) => {
  const filePath = $li.dataset.fullPath;
  if (isFolder($li)) {
    fs.rmdir(filePath, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Directory "${filePath}" is deleted.`);
      }
    });
  } else {
    fs.unlink(filePath, (err) => {
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

const popupMenu = ($li) => {
  if ($li.tagName.toLowerCase() === "li") {
    const menu = new Menu();
    const menuNewFile = new MenuItem({
      label: "New File",
      click: (event) => {
        newFile($li);
      },
    });
    menu.append(menuNewFile);

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
        deleting($li);
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
