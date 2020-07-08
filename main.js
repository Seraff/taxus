const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const menu = require('./js/menu.js')

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

var file_to_open = null
var win = null

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 700,
    minHeight: 200,
    titleBarStyle: "hidden",
    acceptFirstMouse: true,
    webPreferences: {
      nodeIntegration: true
    }
  })

  menu.build_menu()
  win.loadFile('index.html')

  ipcMain.on('scripts_loaded', (event) => {
    if (file_to_open) {
      win.webContents.send('open_file', file_to_open)
    }
  })
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
