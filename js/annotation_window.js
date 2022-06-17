const path = require('path')

const { app, BrowserWindow, ipcMain } = require('electron')
const { writeHeapSnapshot } = require('v8')

class AnnotationWindow {
  constructor (mainWindow, data) {
    this.mainWindow = mainWindow
    this.data = data

    this.window = new BrowserWindow({ width: 300, height: 300,
                                      modal: false,
                                      parent: this.mainWindow,
                                      maximizable: false,
                                      fullscreen: false,
                                      minimizable: false,
                                      resizable: false,
                                      alwaysOnTop: true,
      webPreferences: { preload: path.join(__dirname, '..', 'preload.js') }})

    const htmlPath = path.join(__dirname, '../annotation.html')
    this.window.loadFile(htmlPath)
    console.log('HTML loaded')

    this.window.once('ready-to-show', () => {
      this.window.show()

      this.window.webContents.send('taxus:take_annotation_data', this.data)
    })

    this.window.once('close', () => {
      this.mainWindow.annotationWindow = null
    })
  }

  show() {
    this.window.show()
  }
}

module.exports = AnnotationWindow
