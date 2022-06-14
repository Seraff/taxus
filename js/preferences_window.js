const path = require('path')

const { app, BrowserWindow, ipcMain } = require('electron')

class PreferencesWindow {
  constructor () {
    this.mainWindow = BrowserWindow.getFocusedWindow()

    this.window = new BrowserWindow({ width: 300, height: 500,
                                      modal: false,
                                      parent: this.mainWindow,
                                      maximizable: false,
                                      fullscreen: false,
                                      minimizable: false,
                                      resizable: false,
                                      alwaysOnTop: true,
      webPreferences: { preload: path.join(__dirname, '..', 'preload.js') }})

    const htmlPath = path.join(__dirname, '../preferences.html')
    this.window.loadFile(htmlPath)

    this.window.once('ready-to-show', () => {
      this.window.show()
    })

    this.window.once('close', () => {
      this.mainWindow.preferencesWindow = null
    })
  }

  show () {
    this.window.show()
  }
}

module.exports = PreferencesWindow
