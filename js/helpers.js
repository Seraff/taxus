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

function showSimpleAlert(type, text, detail) {
  var options = {
    type: type,
    message: text,
    detail: detail
  }

  window.api.openAlertWindow(options)
}

function showSimpleWarning(text, detail) {
  showSimpleAlert('warning', text, detail)
}

function showSimpleError(text, detail) {
  showSimpleAlert('error', text, detail)
}

async function showUnsavedFileAlert(ignoreCallback){
  var options = {
    type: 'question',
    buttons: ['Don\'t save', 'Cancel'],
    defaultId: 1,
    title: 'Question',
    message: 'You have unsaved files',
    detail: 'All unsaved data will be lost',
  }

  let resp = await window.api.openAlertWindow(options)

  if (resp === 0) {
    ignoreCallback()
  }
}

function toCamel(str) {
  return str.toLowerCase().replace(/([-_][a-z])/g, group =>
    group
      .toUpperCase()
      .replace('-', '')
      .replace('_', '')
  )
}
