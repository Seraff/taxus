const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const menu = require('./js/menu.js')
const electronLocalshortcut = require('electron-localshortcut')
const ProgressBar = require('electron-progressbar')
const path = require('path')
const fs = require('fs').promises

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

var file_to_open = null
var windows = new Set()

function createWindow () {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 740,
    minHeight: 400,
    // titleBarStyle: "hidden",
    acceptFirstMouse: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.menu = menu.build_menu()

  win.loadFile(path.join(__dirname, 'index.html'))

  win.once('ready-to-show', () => {
    win.show()
  })

  win.on('closed', () => {
    windows.delete(win)
    win = null;
  })

  ipcMain.on('scripts_loaded', (event) => {
    console.log('Scripts loaded')
    // if (file_to_open) {
    //   win.webContents.send('open_file', file_to_open)
    // }
  })

  ipcMain.on('show_progress_bar', (e) => {
    showProgressBar(win)
  })

  ipcMain.on('hide_progress_bar', () => {
    hideProgressBar(win)
  })

  windows.add(win)

  return win
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

// Communication with renderer process

ipcMain.on("taxus:new_window", () => {
  createWindow()
})

ipcMain.handle('taxus:open_file_dialog', async (event, options) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(options)
  if (canceled) {
    return
  } else {
    return filePaths[0]
  }
})

ipcMain.handle('taxus:load_file', async (event, path) => {
  return await fs.readFile(path, 'utf8')
})

ipcMain.handle('taxus:save_file_dialog', async (event, options) => {
  const { canceled, filePaths } = await dialog.showSaveDialog(options)
  if (canceled) {
    return
  } else {
    return filePaths[0]
  }
})

ipcMain.handle('taxus:save_file', async (event, path, content) => {
  return await fs.writeFile(path, content)
})

ipcMain.handle('taxus:update_menu', async (event, states) => {
  var win = BrowserWindow.getAllWindows().find((win) => win.webContents.id === event.sender.id)

  Object.keys(states).forEach((key) => {
    win.menu.getMenuItemById(key).enabled = states[key]
  })
})
