const { Menu } = require("electron");
const recentFiles = require("./recent-files.js");

const isMac = process.platform === "darwin";

const recentFilesMenu = (win) => {
  const files = recentFiles.load();
  return files.map((filePath, _index) => ({
    label: filePath,
    click: () => {
      win.webContents.send("file-opened", filePath);
      recentFiles.add(filePath);
    },
  }));
};

const appMenu = () => {
  return {
    label: "MarkIt",
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" },
    ],
  };
};
const fileMenu = (win) => {
  return {
    label: "File",
    submenu: [
      {
        label: "New File",
        click: () => {
          win.webContents.send("new-file-dialog");
        },
        accelerator: "CommandOrControl+N",
      },
      {
        type: "separator",
      },
      {
        label: "Open...",
        click: () => {
          win.webContents.send("open-file-dialog");
        },
        accelerator: "CommandOrControl+O",
      },
      {
        label: "Open Folder...",
        click: () => {
          win.webContents.send("open-folder-dialog");
        },
        accelerator: "CommandOrControl+D",
      },
      {
        type: "separator",
      },
      {
        label: "Open Recent",
        submenu: recentFilesMenu(win),
      },
      {
        type: "separator",
      },
      {
        label: "Save...",
        click: () => {
          win.webContents.send("save-opened-file");
        },
        accelerator: "CommandOrControl+S",
      },
      {
        label: "Save As",
        click: () => {
          win.webContents.send("save-file-dialog");
        },
        accelerator: "Shift+CommandOrControl+S",
      },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  };
};
const editMenu = (win) => {
  return {
    label: "Edit",
    submenu: [
      {
        role: "undo",
      },
      {
        role: "redo",
      },
      {
        type: "separator",
      },
      {
        label: "Select All",
        click: () => {
          win.webContents.send("select-all");
        },
        accelerator: "CommandOrControl+A",
      },
      {
        type: "separator",
      },
      {
        role: "cut",
      },
      {
        role: "copy",
      },
      {
        role: "paste",
      },
      {
        type: "separator",
      },
      {
        label: "Find",
        click: () => {
          win.webContents.send("local-search");
        },
        accelerator: "CommandOrControl+F",
      },
      {
        label: "Find in Files",
        click: () => {
          win.webContents.send("global-search");
        },
        accelerator: "Alt+CommandOrControl+F",
      },
    ],
  };
};
const viewMenu = (win) => {
  return {
    label: "View",
    submenu: [
      {
        role: "reload",
      },
      {
        role: "toggledevtools",
      },
      {
        type: "separator",
      },
      {
        role: "resetzoom",
      },
      {
        role: "zoomin",
      },
      {
        role: "zoomout",
      },
      {
        type: "separator",
      },
      {
        role: "togglefullscreen",
      },
      {
        label: "Show / Hide Explorer",
        click: () => {
          win.webContents.send("toggle-explorer");
        },
        accelerator: "CommandOrControl+E",
      },
      {
        label: "View / Edit Mode",
        click: () => {
          win.webContents.send("toggle-mode");
        },
        accelerator: "CommandOrControl+/",
      },
    ],
  };
};
const winMenu = () => {
  return {
    role: "window",
    submenu: [
      {
        role: "minimize",
      },
      {
        role: "close",
      },
    ],
  };
};
const helpMenu = () => {
  return {
    role: "help",
    submenu: [
      {
        label: "Learn More",
      },
    ],
  };
};
const buildTemplate = (win) => {
  let menus = [
    fileMenu(win),
    editMenu(win),
    viewMenu(win),
    winMenu(),
    helpMenu(),
  ];
  if (isMac) {
    menus = [appMenu()].concat(menus);
  }
  return menus;
};
const initAppMenu = (win) => {
  const menu = Menu.buildFromTemplate(buildTemplate(win));
  Menu.setApplicationMenu(menu);
};
module.exports = { initAppMenu };
