const path = require('path')

const { app, BrowserWindow, ipcMain } = require('electron')

class PreferencesWindow {
  constructor () {
    this.mainWindow = BrowserWindow.getAllWindows()[0]

    this.window = new BrowserWindow({ width: 300, height: 500,
                                                               modal: false,
                                                               parent: this.mainWindow,
                                                               maximizable: false,
                                                               fullscreen: false,
                                                               minimizable: false,
                                                               resizable: false,
                                                               webPreferences: { nodeIntegration: true }})
    const htmlPath = path.join(__dirname, '../preferences.html')
    this.window.loadFile(htmlPath)

    this.window.once('ready-to-show', () => {
      this.window.show()
    })

    // Preferences window asks us to get current preferences
    ipcMain.on('give_current_prefs', (event) => {
      this.mainWindow.webContents.send('give_current_prefs')
    })

    // After main window responded, return the data to preferences window
    ipcMain.on('take_current_prefs', (event, message) => {
      this.window.webContents.send('take_current_prefs', message)
    })

    // When the users clicks Save button, take new preferences and send to main window
    ipcMain.on('take_new_prefs', (event, message) => {
      this.mainWindow.webContents.send('take_new_prefs', message)
    })

    // When main window responds that it got new preferences, tell it to pref window
    ipcMain.on('new_preferences_taken', (event) => {
      this.window.webContents.send('new_preferences_taken')
    })

    // removing old listeners when closing
    this.window.on('closed', () => {
      ipcMain.removeAllListeners('take_current_prefs')
      ipcMain.removeAllListeners('give_current_prefs')
      ipcMain.removeAllListeners('take_new_prefs')
      ipcMain.removeAllListeners('new_preferences_taken')
    })
  }

  show () {
    this.window.show()
  }
}

module.exports = PreferencesWindow
