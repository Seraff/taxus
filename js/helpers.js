const path = require('path')

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function fangorize_path (pth) {
  var parsed = path.parse(pth)
  return parsed.dir + path.sep + parsed.name + ".fangorn" + parsed.ext
}

function path_is_fangorized (pth) {
  return path.parse(pth).name.match(/\.fangorn$/) != null
}

function hasOwnProperty (object, property) {
  return Object.prototype.hasOwnProperty.call(object, property)
}

function dispatchDocumentEvent (name) {
  var event = new Event(name)
  document.dispatchEvent(event)
}

function showUnsavedFileAlert(callback){
  var options = {
    type: 'question',
    buttons: ['Cancel', 'Don\'t save'],
    title: 'Question',
    defaultId: 0,
    message: 'You have unsaved files',
    detail: 'All unsaved data will be lost',
  }

  dialog.showMessageBox(null, options).then((resp) => {
    if (resp.response === 1){
      callback()
    }
  })
}
