class ProgressBarManager {
  static COMPLEXITY_THRESHOLD = 1000

  constructor() {
    this.complexity = 0
  }

  show() {
    window.api.showProgressBar()
  }

  tryToShow() {
    if (this.shouldBeShown()) {
      this.show()
    }
  }

  hide() {
    window.api.hideProgressBar()
  }

  withProgressBar(func) {
    this.show()
    func().then(() => {

      this.hide()
    })
  }

  withProgressBarAttempt(func) {
    if (this.shouldBeShown()){
      this.show()
    }
    func()
    this.hide()
  }

  setNewComplexity(val) {
    this.complexity = val
  }

  shouldBeShown() {
    return this.complexity >= ProgressBarManager.COMPLEXITY_THRESHOLD
  }
}
