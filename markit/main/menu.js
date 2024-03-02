const { Menu, MenuItem } = require("electron");

const isMac = process.platform === "darwin";
const appMenu = () => {
  if (isMac) {
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
  }
  return {};
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
          win.webContents.send("open-file-directory-dialog");
        },
        accelerator: "CommandOrControl+O",
      },
      {
        label: "Open Recent",
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
const editMenu = () => {
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
        role: "cut",
      },
      {
        role: "copy",
      },
      {
        role: "paste",
      },
    ],
  };
};
const viewMenu = () => {
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
  return [
    appMenu(),
    fileMenu(win),
    editMenu(),
    viewMenu(),
    winMenu(),
    helpMenu(),
  ];
};
const initAppMenu = (win) => {
  const menu = Menu.buildFromTemplate(buildTemplate(win));
  Menu.setApplicationMenu(menu);
};
module.exports = { initAppMenu };
