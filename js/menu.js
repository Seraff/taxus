const path = require('path')

var electron = require("electron")
var app = electron.app
var Menu = electron.Menu
var BrowserWindow = electron.BrowserWindow
var shell = electron.shell

var PreferencesWindow = require('./preferences_window.js')

const template = [
  {
    label: 'File',
    submenu: [
      {
        id: "open-tree",
        label: "Open Tree",
        accelerator: "CmdOrCtrl+O"
      },
      {
        id: "save-tree",
        label: "Save Tree",
        accelerator: "CmdOrCtrl+S"
      },
      {
        id: "save-tree-as",
        label: "Save Tree as..."
      },
      {
        type: 'separator'
      },
      {
        id: "open-fasta",
        label: "Open Fasta",
        accelerator: "CmdOrCtrl+Shift+O"
      },
      {
        id: "save-fasta",
        label: "Save Fasta",
        accelerator: "CmdOrCtrl+Shift+S"
      },
      {
        id: "save-fasta-as",
        label: "Save Fasta as..."
      },
      {
        id: "save-selection-as-fasta",
        label: "Save Selection as Fasta"
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
          label: "PNG"
        },
        {
          id: "export-to-svg",
          label: "SVG"
        },
        ]
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        role: "cut"
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: "copy"
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        role: "paste"
      },
      {
        label: "Select All",
        role: 'selectAll',
        accelerator: "CmdOrCtrl+A"
      },
      {
        label: "Select All in Tree",
        id: 'select-all',
        accelerator: "CmdOrCtrl+Shift+A"
      },
      {
        id: 'select-descendants',
        label: "Select Descendants"
      },
      {
        type: 'separator'
      },
      {
        id: "find",
        label: 'Find',
        accelerator: 'CmdOrCtrl+F'
      },
      {
        id: "toggle-selection-mode",
        label: 'Toggle Selection Mode',
        accelerator: 'Ctrl+Tab'
      },
      {
        type: 'separator'
      },
      {
        id: "reroot",
        label: 'Reroot',
        accelerator: 'CmdOrCtrl+R'
      },
      {
        id: "rotate-branch",
        label: 'Rotate Branch',
        accelerator: 'CmdOrCtrl+Shift+R'
      },
      {
        id: "remove-selected",
        label: 'Delete Selected',
        accelerator: 'CmdOrCtrl+D'
      },
      {
        id: "remove-unselected",
        label: 'Delete Unselected',
        accelerator: 'CmdOrCtrl+U'
      },
      {
        id: "restore-selected",
        label: 'Keep Selected',
        accelerator: 'CmdOrCtrl+K'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        id: "zoom-in",
        label: "Zoom in",
        accelerator: "CmdOrCtrl+Plus"
      },
      {
        id: "zoom-out",
        label: "Zoom out",
        accelerator: "CmdOrCtrl+-"
      },
      {
        type: 'separator'
      },
      {
        id: "toggle-cladogram-view",
        label: 'Toggle Cladogram View',
        accelerator: 'CmdOrCtrl+Shift+C'
      },
      {
        type: 'separator'
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+Alt+R',
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
      }
    ]
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'Project GitHub',
        click: function() { shell.openExternal('https://github.com/Seraff/taxus') }
      },
      {
        label: 'Documentation',
        click: function() { shell.openExternal('https://taxus.readthedocs.io/en/latest/') }
      },
    ]
  },
];

if (process.platform === 'darwin') {
  template.unshift({
    label: "Taxus",
    submenu: [
      {
        label: 'About Taxus',
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Preferences',
        accelerator: 'Command+,',
        role: 'preferences',
        click: _ => {
          new PreferencesWindow()
        },
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
        label: 'Hide Taxus',
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
        id: 'quit',
        accelerator: 'Command+Q'
      },
    ]
  });
} else {
  file_submenu = template[0].submenu

  file_submenu.push({
                      label: 'Preferences',
                      accelerator: 'CmdOrCtrl+,',
                      role: 'preferences',
                      click: _ => {
                        new PreferencesWindow()
                      },
                    })

  file_submenu.push({ type: 'separator' })

  file_submenu.push({
                      label: 'Quit',
                      id: 'quit'
                    })

  help_submenu = template[template.length - 1].submenu
  help_submenu.unshift({
                          label: 'About Taxus',
                          role: 'about'
                        })

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
    if (item !== null){
      item.click = callback;
    }
  }

  Menu.setApplicationMenu(menu);
}

module.exports = { build_menu: build_menu };
