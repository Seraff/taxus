const app = require('electron')
const { BrowserWindow, dialog } = require('electron').remote
const ipcRenderer = require('electron').ipcRenderer

const cp = require('child_process')
const fileDialog = require('file-dialog')
const FindInPage = require('electron-find').FindInPage
const AColorPicker = require('a-color-picker')
const Fangorn = require('./js/fangorn.js')
const ColorPicker = require('./js/color_picker.js')
const svgToPng = require('save-svg-as-png')

var fangorn = null

const TREE_EXT = ['tre', 'tree', 'nexus', 'nex', 'nxs', 'newick', 'txt']
const FASTA_EXT = ['fa', 'fas', 'fasta', 'fna', 'faa', 'ffn', 'frn']

function update_controls (fangorn) {
  menu = app.remote.Menu.getApplicationMenu()

  var disabled_menu_items = ['open-fasta', 'save-fasta', 'save-fasta-as', 'reroot', 'select-all']
  disabled_menu_items.forEach(function (item) {
    menu.disableItemById(item)
  })

  $('#annotate-node-action').attr('disabled', 'disabled')
  $('#reroot-action').attr('disabled', 'disabled')
  $('[data-direction]').attr('disabled', 'disabled')
  $('.mark-button').attr('disabled', 'disabled')
  $('#change-branch-color-action').attr('disabled', 'disabled')

  if (fangorn.tree_is_loaded()) {
    $('[data-direction]').removeAttr('disabled')
    $('#open-fasta').removeAttr('disabled')
    menu.enableItemById('open-fasta')
    menu.enableItemById('select-all')

    if (fangorn.fasta_is_loaded() && fangorn.is_one_leaf_selected()) { $('#annotate-node-action').removeAttr('disabled') }

    if (fangorn.get_selection().length == 1) {
      $('#reroot-action').removeAttr('disabled')
      menu.enableItemById('reroot')
    }

    if (fangorn.get_selection().length > 0) { $('#change-branch-color-action').removeAttr('disabled') }

    if (fangorn.fasta_is_loaded() && fangorn.get_selected_leaves().length > 0) { $('.mark-button').removeAttr('disabled') }

    if (fangorn.fasta_is_loaded()) {
      $('#save-fasta-action').removeAttr('disabled')
      menu.enableItemById('save-fasta')
      menu.enableItemById('save-fasta-as')
    } else {
      $('#save-fasta-action').attr('disabled', 'disabled')
    }
  }
}

function show_alert (title, body) {
  $('#universal-dialog').find('.title').html(title)
  $('#universal-dialog').find('.modal-body').html(body)
  $('#universal-dialog')[0].showModal()
}

function show_log_alert (title, subtitle, rows) {
  $('#universal-dialog').find('.title').html(title)

  $('#universal-dialog').find('.modal-body').html('')
  $('#universal-dialog').find('.modal-body').append(subtitle)
  $('#universal-dialog').find('.modal-body').append('<div id="log_body" style="overflow-y: auto; max-height: 200px; border: none;"></div>')

  rows.forEach(function (r) { $('#log_body').append(r + '</br>') })

  $('#universal-dialog')[0].showModal()
}

function set_window_header (text = null) {
  var header = 'Fangorn'

  if (text) { header += ' — ' + text }

  $('h1#window-header').html(header)
}

function open_tree_action (e) {
  var options = {
    properties: ['openFile'],
    filters: [{ name: 'Trees', extensions: TREE_EXT }],
    title: 'Open tree'
  }

  dialog.showOpenDialog(options).then(result => {
    if (result.filePaths.length == 0) { return false }

    var path = result.filePaths[0]
    fangorn.load_tree_file(path)
    set_window_header(path.replace(/^.*[\\\/]/, ''))
  })
}

function save_tree_action () {
  fangorn.save_tree()
}

function save_tree_as_action () {
  var options = { title: 'Save tree as...', defaultPath: fangorn.tree_path }
  dialog.showSaveDialog(options).then(result => {
    if (result.canceled || result.filePath.length === 0) { return true }

    fangorn.save_tree(result.filePath)
    fangorn.load_tree_file(result.filePath)
    set_window_header(result.filePath.replace(/^.*[\\\/]/, ''))
  })
}

function open_fasta_action () {
  var options = {
    properties: ['openFile'],
    filters: [{ name: 'Fasta', extensions: FASTA_EXT }],
    title: 'Open fasta file'
  }

  dialog.showOpenDialog(options).then(result => {
    if (result.filePaths.length === 0) { return false }

    var path = result.filePaths[0]
    fangorn.load_fasta_file(path)
  })
}

function remove_selected_action () {
  fangorn.get_selection().forEach(function (n) { n.mark() })
  fangorn.get_tree().refresh()
  fangorn.get_tree().modify_selection(function (n) { return false })
}

function remove_unselected_action () {
  var selected = fangorn.get_selection()

  fangorn.get_leaves().forEach(function (l) {
    if (!selected.includes(l)) { l.mark() }
  })

  fangorn.get_tree().refresh()
  fangorn.get_tree().modify_selection(function (n) { return false })
}

function restore_selected_action () {
  fangorn.get_selection().forEach(function (n) { n.unmark() })
  fangorn.get_tree().refresh()
  fangorn.get_tree().modify_selection(function () {})
}

function save_fasta_action () {
  fangorn.save_fasta()
}

function save_fasta_as_action () {
  var options = { title: 'Save fasta as...', defaultPath: fangorn.fasta.out_path }

  dialog.showSaveDialog(options).then(result => {
    if (result.canceled || result.filePath.length === 0) { return true }

    fangorn.save_fasta(result.filePath, function () {
      fangorn.load_fasta_file(result.filePath)
    })
  })
}

function show_fasta_action () {
  if ($('#fasta-panel').is(':hidden')) {
    $('#fasta-panel').show()
    $('#show-fasta-action').addClass('btn-pressed')
  } else {
    $('#fasta-panel').hide()
    $('#show-fasta-action').removeClass('btn-pressed')
  }
}

function annotate_node_action () {
  if (!fangorn.fasta_is_loaded() || fangorn.get_selection().length != 1) { return false }

  var node = fangorn.get_selection()[0]
  var title = node.fasta.title
  $('#seq-title-input').val(title)

  $('#annotate-dialog')[0].showModal()
}

function reroot_action () {
  fangorn.reroot_to_selected_node()
}

function export_to_png_action () {
  options = { fonts: [], scale: 1.5 }
  svgToPng.saveSvgAsPng(d3.select('svg#tree_display').node(), 'tree.png', options)
}

function export_to_svg_action () {
  options = { fonts: [] }
  svgToPng.saveSvg(d3.select('svg#tree_display').node(), 'tree.svg', options)
}

function applyPreferences () {
  fangorn.get_tree().safe_update()
}

$(document).ready(function () {
  set_window_header()

  document.addEventListener('fangorn_state_update', function (e) {
    update_controls(fangorn)
  })

  fangorn = Fangorn()
  fangorn.dispatch_state_update()

  // *** Menu actions *** //

  menu.setCallbackOnItem('open-tree', open_tree_action)
  menu.setCallbackOnItem('save-tree', save_tree_action)
  menu.setCallbackOnItem('save-tree-as', save_tree_as_action)

  menu.setCallbackOnItem('open-fasta', open_fasta_action)
  menu.setCallbackOnItem('save-fasta', save_fasta_action)
  menu.setCallbackOnItem('save-fasta-as', save_fasta_as_action)

  menu.setCallbackOnItem('export-to-png', export_to_png_action)
  menu.setCallbackOnItem('export-to-svg', export_to_svg_action)

  $(window).on('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
      findInPage.openFindWindow()
    }
  })

  $('#search-action').on('click', function () {
    findInPage.openFindWindow()
  })

  $('#remove-selected-action').on('click', remove_selected_action)
  $('#remove-unselected-action').on('click', remove_unselected_action)
  $('#restore-selected-action').on('click', restore_selected_action)

  $('#show-fasta-action').on('click', show_fasta_action)

  $('#annotate-node-action').on('click', annotate_node_action)

  $('#reroot-action').on('click', reroot_action)
  menu.setCallbackOnItem('reroot', reroot_action)

  $('#annotation-dialog-cancel').on('click', function () {
    $('#seq-title-input').val('')
    $('#annotate-dialog')[0].close(false)
  })

  $('#annotation-dialog-save').on('click', function () {
    var node = fangorn.get_selection()[0]
    fangorn.update_node_title(node, $('#seq-title-input').val())
    $('#seq-title-input').val('')
    $('#annotate-dialog')[0].close(false)
    fangorn.get_tree().safe_update()
  })

  $('#universal-dialog-close').on('click', function () {
    $('#universal-dialog')[0].close(false)
  })

  $('[data-direction]').on('click', function () {
    var which_function = $(this).data('direction') == 'vertical' ? fangorn.get_tree().spacing_x : fangorn.get_tree().spacing_y
    which_function(which_function() + (+$(this).data('amount'))).safe_update()
  })

  $(document).on('click', '.fasta-pane-entry', function (e) {
    var id = $(e.target).parent('.fasta-pane-entry').attr('id')
    var node = fangorn.fasta_pane.node_by_id(id)
    fangorn.get_tree().modify_selection(function (n) { return node == n.target })
  })

  // Picker logic

  var picker = new ColorPicker('#branch-color-picker', '#change-branch-color-action', ['#branch-color'])
  picker.add_color_change_callback(function (color) {
    fangorn.set_selected_nodes_annotation({ color: color })
  })

  document.addEventListener('selection_modified', function (e) {
    var selection = fangorn.get_selection()

    if (selection.length === 1) {
      var color = selection[0].parsed_annotation.color

      if (color) {
        picker.set_color(color)
      } else {
        picker.remove_color()
      }
    } else { picker.remove_color() }
  })

  // Preferences logic

  document.addEventListener('preferences_update', applyPreferences)

  ipcRenderer.on('give_current_prefs', (event, message) => {
    ipcRenderer.send('take_current_prefs', fangorn.preferences || {})
  })

  ipcRenderer.on('take_new_prefs', (event, message) => {
    if (fangorn.preferences) { fangorn.preferences.applyToCurrent(message) }
    ipcRenderer.send('new_preferences_taken')
  })
})
