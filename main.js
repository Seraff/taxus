const { app, BrowserWindow } = require('electron')

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

function createWindow () {

  let win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.loadFile('index.html')
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  app.quit()
})
