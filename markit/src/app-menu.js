const { Menu } = require("electron");

const isMac = process.platform === "darwin";
const template = [
  ...(isMac
    ? [
        {
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
        },
      ]
    : []),
  {
    label: "File",
    submenu: [
      {
        label: "New File",
      },
      {
        label: "New Tab",
      },
      {
        label: "New Window",
      },
      {
        type: "separator",
      },
      {
        label: "Open File",
        click: openFile,
      },
      {
        label: "Open Project",
        click: () => {
          win?.webContents.send("open-directory-dialog");
        },
      },
      {
        label: "Open Recent",
      },
      {
        type: "separator",
      },
      {
        label: "Save...",
      },
      {
        label: "Save All...",
      },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  },
  {
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
  },

  {
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
  },

  {
    role: "window",
    submenu: [
      {
        role: "minimize",
      },
      {
        role: "close",
      },
    ],
  },

  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
