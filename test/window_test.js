const hooks = require('./hooks')

describe('Window opening', function () {
  var app
  var client
  var menu

  before(async () => {
    var application = await hooks.startAppWithMenu()
    app = await application.app
    menu = await application.menu

    client = app.client
  })

  // after(async () => {
  //   await app.stop()
  // })

  // it('opens a window', function () {
  //   return app.client.waitUntilWindowLoaded()
  //     .getWindowCount().should.eventually.equal(1)
  // })

  it('loads a tree', async () => {
    console.log(client.taxus)

  })
})
