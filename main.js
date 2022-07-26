const { app, BrowserWindow, ipcMain, dialog, Menu, clipboard } = require('electron')
const menu = require('./js/menu.js')
const electronLocalshortcut = require('electron-localshortcut')
const ProgressBar = require('electron-progressbar')
const path = require('path')
const fs = require('fs').promises

var AnnotationWindow = require('./js/annotation_window.js')

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

var file_to_open = null
var app_just_started = true
var windows = new Set()
var windowToCloseIds = new Set()

function createWindow () {
  let hide_title_bar = process.platform == 'darwin'

  let win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 740,
    minHeight: 400,
    titleBarStyle: hide_title_bar ? "hidden" : undefined,
    acceptFirstMouse: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.menu = menu.build_menu()
  win.createWindow = createWindow
  win.preferencesWindow = null
  win.annotationWindow = null

  win.loadFile(path.join(__dirname, 'index.html'))

  win.once('ready-to-show', () => {
    win.show()
  })

  win.on('close', (e) => {
    if (windowToCloseIds.has(win.id)) {
      windowToCloseIds.delete(win.id)
    } else {
      e.preventDefault()
      win.webContents.send('taxus:close_window')
    }
  })

  win.on('closed', () => {
    windows.delete(win)
    win = null
  })

  windows.add(win)

  return win
}

function sendFileOpen() {
  let win = windows[0]

  if (app.isReady() && win && file_to_open) {
    win.webContents.send('taxus:open_file', file_to_open)
    file_to_open = null
  }
}

ipcMain.on('taxus:window_is_ready', (event) => {
  app_just_started = false

  if (file_to_open) {
    win = getSenderWindow(event)
    win.webContents.send('taxus:open_file', file_to_open)
    file_to_open = null
  }
})

app.on('will-finish-launching', () => {
  app.on('open-file', (event, path) => {

    file_to_open = path

    if (!app_just_started)
      createWindow()
  })

  if (process.platform !== 'darwin' && process.argv.length >= 2) {
    file_to_open = process.argv[1]
  }
})

app.on('ready', createWindow)


app.on('window-all-closed', () => {
  app.quit()
})

// Communication with renderer process

function getSenderWindow(event) {
  let win = BrowserWindow.getAllWindows().find((w) => {
    return w.webContents.id === event.sender.id
  })
  return win
}

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
  const { canceled, filePath } = await dialog.showSaveDialog(options)
  if (canceled) {
    return
  } else {
    return filePath
  }
})

ipcMain.handle('taxus:save_file', async (event, path, content) => {
  return await fs.writeFile(path, content)
})

ipcMain.handle('taxus:update_menu', async (event, states) => {
  let win = getSenderWindow(event)

  Object.keys(states).forEach((key) => {
    win.menu.getMenuItemById(key).enabled = states[key]
  })
})

// Progress Bar

ipcMain.on('taxus:show_progress_bar', (event) => {
  let win = getSenderWindow(event)

  win.currentProgressBar = new ProgressBar({
    text: 'Working...',
    browserWindow: {
      parent: win,
      modal: true
    }
  })
})

ipcMain.on('taxus:hide_progress_bar', (event) => {
  let win = getSenderWindow(event)

  if (win.currentProgressBar && !win.currentProgressBar.isCompleted()) {
    win.currentProgressBar.setCompleted()
    win.currentProgressBar = null
  }
})

// Preferences window communication

ipcMain.on('taxus:give_current_prefs', (event) => {
  let prefWin = getSenderWindow(event)
  let mainWin = prefWin.getParentWindow()

  mainWin.webContents.send('taxus:give_current_prefs')
})


ipcMain.on('taxus:take_current_prefs', (event, prefs) => {
  let mainWin = getSenderWindow(event)
  let prefWin = mainWin.preferencesWindow

  prefWin.window.webContents.send('taxus:take_current_prefs', prefs)
})

ipcMain.on('taxus:take_new_prefs', (event, prefs) => {
  let prefWin = getSenderWindow(event)
  let mainWin = prefWin.getParentWindow()

  mainWin.webContents.send('taxus:take_new_prefs', prefs)
})

ipcMain.on('taxus:new_prefs_taken', (event, prefs) => {
  let mainWin = getSenderWindow(event)

  mainWin.preferencesWindow.window.close()
  mainWin.preferencesWindow = null
})

ipcMain.on('taxus:close_pref_window', (event, prefs) => {
  let prefWin = getSenderWindow(event)
  let mainWin = prefWin.getParentWindow()

  mainWin.preferencesWindow.window.close()
  mainWin.preferencesWindow = null
})

// Annotation window communication

ipcMain.on('taxus:open_annotation_window', (event, data) => {
  let mainWin = getSenderWindow(event)

  if (!mainWin.annotationWindow){
    let annotWin = new AnnotationWindow(mainWin, data)
    mainWin.annotationWindow = annotWin
  }
})

ipcMain.on('taxus:apply_new_annotation', (event, data) => {
  let annotWin = getSenderWindow(event)
  let mainWin = annotWin.getParentWindow()

  mainWin.webContents.send('taxus:apply_new_annotation', data)
})

ipcMain.on('taxus:close_annotation_window', (event) => {
  let annotWin = getSenderWindow(event)
  let mainWin = annotWin.getParentWindow()

  mainWin.annotationWindow.window.close()
  mainWin.annotationWindow = null
})

// Put text to clipboard

ipcMain.on('taxus:copy_text', (event, text) => {
  clipboard.writeText(text)
})

// Alert window

ipcMain.handle('taxus:open_alert_window', async (event, options) => {
  const { response } = await dialog.showMessageBox(null, options)
  return response
})


ipcMain.on('taxus:close_window', (event) => {
  let win = getSenderWindow(event)
  windowToCloseIds.add(win.id)
  win.close()
})


ipcMain.on('taxus:quit', (event) => {
  // send to window request to close
  windows.forEach((w) => {
    w.focus()
    w.webContents.send('taxus:close_window')
  })
})


ipcMain.on('taxus:set_title', (event, text) => {
  let win = getSenderWindow(event)
  win.setTitle(text)
})
