const Application = require('spectron').Application
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const spectronMenuAddon = require('spectron-menu-addon')

var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')

if (process.platform === 'win32') {
    electronPath += '.cmd'
}

var appPath = path.join(__dirname, '..')

global.before(function () {
    chai.should()
    chai.use(chaiAsPromised)
})

module.exports = {
  async startApp() {
    var app = await new Application({
            path: electronPath,
            args: [appPath]
        }).start()

    return app
  },

  async startAppWithMenu() {
    const menuAddon = new spectronMenuAddon.SpectronMenuAddon()

    var app = menuAddon.createApplication({
            path: electronPath,
            args: [appPath]
        }).start()

    return { app: app, menu: menuAddon }
  },

  async stopApp(app) {
    if (app && app.isRunning()) {
      await app.stop()
    }
  }
};
