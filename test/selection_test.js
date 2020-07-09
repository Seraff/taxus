const hooks = require('./hooks')

describe('Tree selection', function () {
  var app

  before(async () => {
    app = await hooks.startApp()
  })

  after(async () => {
    await app.stop()
  })

  // it('')


})
