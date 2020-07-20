const ipcRenderer = require('electron').ipcRenderer

class ProgressBarManager {
  constructor () {
    this.complexity = 0
  }

  show () {
    ipcRenderer.send('show_progress_bar')
  }

  tryToShow () {
    if (this.shouldBeShown()) {
      this.show()
    }
  }

  hide () {
    ipcRenderer.send('hide_progress_bar')
  }

  withProgressBar (func) {
    this.show()
    func()
    this.hide()
  }

  withProgressBarAttempt (func) {
    if (this.shouldBeShown()){
      this.show()
    }
    func()
    this.hide()
  }

  setNewComplexity (val) {
    this.complexity = val
  }

  shouldBeShown () {
    return this.complexity >= ProgressBarManager.COMPLEXITY_THRESHOLD
  }
}

ProgressBarManager.COMPLEXITY_THRESHOLD = 1500

module.exports = ProgressBarManager
