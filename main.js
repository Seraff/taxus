const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const menu = require('./js/menu.js')
const electronLocalshortcut = require('electron-localshortcut');
const ProgressBar = require('electron-progressbar');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

var file_to_open = null
var win = null

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 740,
    minHeight: 400,
    titleBarStyle: "hidden",
    acceptFirstMouse: true,
    webPreferences: {
      nodeIntegration: true
    }
  })

  menu.build_menu()
  win.loadFile('index.html')

  // Workaround for zoom-in action alias
  electronLocalshortcut.register(win, 'CmdOrCtrl+=', () => {
    Menu.getApplicationMenu().getMenuItemById('zoom-in').click()
  });

  ipcMain.on('scripts_loaded', (event) => {
    if (file_to_open) {
      win.webContents.send('open_file', file_to_open)
    }
  })

  ipcMain.on('show_progress_bar', (e) => {
    showProgressBar(win)
  })

  ipcMain.on('hide_progress_bar', () => {
    hideProgressBar(win)
  })
}

function showProgressBar(w) {
  w.currentProgressBar = new ProgressBar({
    text: 'Working...',
    browserWindow: {
      parent: w,
      modal: true,
      webPreferences: { nodeIntegration: true }
    }
  })
}

function hideProgressBar(w) {
  if (w.currentProgressBar && !w.currentProgressBar.isCompleted()) {
    w.currentProgressBar.setCompleted()
    w.currentProgressBar = null
  }
}

function sendFileOpen() {
  if (app.isReady() && win && file_to_open) {
    win.webContents.send('open_file', file_to_open)
  }
}

app.on('will-finish-launching', () => {
  app.on('open-file', (event, path) => {
    file_to_open = path
    sendFileOpen()
  })

  if (process.platform !== 'darwin' && process.argv.length >= 2) {
    file_to_open = process.argv[1]
    sendFileOpen()
  }
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  app.quit()
})
