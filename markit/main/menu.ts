import { Menu, BrowserWindow, MenuItemConstructorOptions } from "electron";
import * as recentOpens from "./recent-opens";

const isMac = process.platform === "darwin";

const recentOpensMenu = (win: BrowserWindow): MenuItemConstructorOptions[] => {
  const files = recentOpens.load();
  return files.map((filePath: string, _index: number) => ({
    label: filePath,
    click: () => {
      win.webContents.send("file-opened", filePath);
      recentOpens.add(filePath);
    },
  }));
};

const appMenu = (): MenuItemConstructorOptions => {
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

const fileMenu = (win: BrowserWindow): MenuItemConstructorOptions => {
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
        submenu: recentOpensMenu(win),
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
        type: "separator",
      },
      {
        label: "Settings",
        click: () => {
          win.webContents.send("open-settings");
        },
        accelerator: "CommandOrControl+,",
      },
      {
        label: "Save As",
        click: () => {
          win.webContents.send("save-file-dialog");
        },
        accelerator: "Shift+CommandOrControl+S",
      },
      {
        type: "separator",
      },
      {
        label: "Export to HTML...",
        click: () => {
          win.webContents.send("export-document");
        },
        accelerator: "CommandOrControl+E",
      },
      {
        type: "separator",
      },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  };
};

const editMenu = (win: BrowserWindow): MenuItemConstructorOptions => {
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
        type: "separator",
      },
      {
        label: "Insert Table...",
        click: () => {
          win.webContents.send("insert-table");
        },
        accelerator: "CommandOrControl+Alt+T",
      },
      {
        label: "Find in Files",
        click: () => {
          win.webContents.send("global-search");
        },
        accelerator: "CommandOrControl+Alt+F",
      },
    ],
  };
};

const viewMenu = (win: BrowserWindow): MenuItemConstructorOptions => {
  return {
    label: "View",
    submenu: [
      {
        role: "reload",
      },
      {
        role: "toggleDevTools",
      },
      {
        type: "separator",
      },
      {
        role: "resetZoom",
      },
      {
        role: "zoomIn",
      },
      {
        role: "zoomOut",
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
        accelerator: "CommandOrControl+B",
      },
      {
        label: "Show / Hide Table of Contents",
        click: () => {
          win.webContents.send("toggle-toc");
        },
        accelerator: "CommandOrControl+Shift+T",
      },
      {
        label: "Show / Hide Word Count",
        click: () => {
          win.webContents.send("toggle-word-count");
        },
        accelerator: "CommandOrControl+Shift+W",
      },
      {
        label: "View / Edit Mode",
        click: () => {
          win.webContents.send("toggle-mode");
        },
        accelerator: "CommandOrControl+/",
      },
      {
        label: "Switch Recent File",
        click: () => {
          win.webContents.send("switch-recent-file");
        },
        accelerator: "CommandOrControl+Tab",
      },
    ],
  };
};

const winMenu = (): MenuItemConstructorOptions => {
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

const helpMenu = (win: BrowserWindow): MenuItemConstructorOptions => {
  return {
    role: "help",
    submenu: [
      {
        label: "Keyboard Shortcuts",
        click: () => {
          win.webContents.send("show-keyboard-shortcuts");
        },
        accelerator: "CmdOrCtrl+?",
      },
      {
        type: "separator",
      },
      {
        label: "Learn More",
      },
    ],
  };
};

const buildTemplate = (win: BrowserWindow): MenuItemConstructorOptions[] => {
  let menus: MenuItemConstructorOptions[] = [
    fileMenu(win),
    editMenu(win),
    viewMenu(win),
    winMenu(),
    helpMenu(win),
  ];
  if (isMac) {
    menus = [appMenu()].concat(menus);
  }
  return menus;
};

export function initAppMenu(win: BrowserWindow): void {
  const menu = Menu.buildFromTemplate(buildTemplate(win));
  Menu.setApplicationMenu(menu);
}
