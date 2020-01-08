var electron = require("electron")
var app = electron.app
var Menu = electron.Menu
var BrowserWindow = electron.BrowserWindow

const template = [
  {
    label: 'File',
    submenu: [
      {
        id: "open-tree",
        label: "Open tree",
        accelerator: "CmdOrCtrl+O"
      },
      {
        id: "save-tree",
        label: "Save tree",
        accelerator: "CmdOrCtrl+S"
      },
      {
        id: "save-tree-as",
        label: "Save tree as...",
        accelerator: "CmdOrCtrl+Shift+S"
      },
      {
        type: 'separator'
      },
      {
        id: "open-fasta",
        label: "Open fasta",
        accelerator: "CmdOrCtrl+Shift+O"
      },
      {
        id: "save-fasta",
        label: "Save fasta"
      },
      {
        id: "save-fasta-as",
        label: "Save fasta as..."
      },
      {
        type: 'separator'
      },
      {
        id: "export",
        label: "Export to...",
        submenu: [
        {
          id: "export-to-png",
          label: "Png"
        },
        {
          id: "export-to-pdf",
          label: "Pdf"
        },
        ]
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        id: "reroot",
        label: 'Reroot',
        accelerator: 'CmdOrCtrl+Shift+R'
      },
      {
        id: "copy",
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: "copy:"
      },
      {
        id: "paste",
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: "paste:"
      },
      {
        id: "select-all",
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A'
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Full Screen',
        accelerator: (function() {
          if (process.platform === 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
          if (process.platform === 'darwin')
            return 'Alt+Command+I';
          else
            return 'Ctrl+Shift+I';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.toggleDevTools();
        }
      },
    ]
  },
  {
    label: 'Window',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
    ]
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: function() { shell.openExternal('http://electron.atom.io') }
      },
    ]
  },
];

if (process.platform === 'darwin') {
  template.unshift({
    label: "Fangorn",
    submenu: [
      {
        label: 'About Fangorn',
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide Fangorn',
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: function() { app.quit(); }
      },
    ]
  });
}

function build_menu() {
  const menu = Menu.buildFromTemplate(template);

  menu.disableItemById = function(id){
    var item = menu.getMenuItemById(id);
    item.enabled = false;
  }

  menu.enableItemById = function(id){
    var item = menu.getMenuItemById(id);
    item.enabled = true;
  }

  menu.setCallbackOnItem = function(item_id, callback){
    var item = menu.getMenuItemById(item_id);
    item.click = callback;
  }

  Menu.setApplicationMenu(menu);
}

module.exports = { build_menu: build_menu };
