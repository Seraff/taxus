function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function taxusize_path (pth) {
  var parsed = window.modules.path.parse(pth)
  return parsed.dir + window.modules.path.sep + parsed.name + ".taxus" + parsed.ext
}

function path_is_taxusized (pth) {
  return window.modules.path.parse(pth).name.match(/\.taxus$/) != null
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

function toCamel(str) {
  return str.toLowerCase().replace(/([-_][a-z])/g, group =>
    group
      .toUpperCase()
      .replace('-', '')
      .replace('_', '')
  )
}
