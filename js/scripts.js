const $ = require('jquery')
const app = require('electron')
const { BrowserWindow, dialog } = require('electron').remote
const { clipboard } = require('electron')
const ipcRenderer = require('electron').ipcRenderer

const fs = require('fs')
const cp = require('child_process')
const fileDialog = require('file-dialog')
const AColorPicker = require('a-color-picker')
const svgToPng = require('save-svg-as-png')
const Split = require('split.js')

const Fangorn = require('./js/fangorn.js')
const FastaPane = require('./js/fasta_pane.js')
const SearchPanel = require('./js/frontend/search_panel.js')
const ColorPicker = require('./js/color_picker.js')
const BtnGroupRadio = require('./js/btn_group_radio.js')

const unhandled = require('electron-unhandled');

const TREE_EXT = ['tre', 'tree', 'nexus', 'nex', 'nxs', 'newick', 'txt']
const FASTA_EXT = ['fa', 'fas', 'fasta', 'fna', 'faa', 'ffn', 'frn']

var fangorn = null
var modeSelector = null

function update_controls (fangorn) {
  menu = app.remote.Menu.getApplicationMenu()

  var disabled_menu_items = ['open-fasta', 'save-fasta', 'save-fasta-as', 'save-selection-as-fasta',
                             'reroot', 'rotate-branch', 'select-all', 'select-descendants',
                             'remove-selected', 'remove-unselected', 'restore-selected', 'find', 'toggle-selection-mode']

  disabled_menu_items.forEach(function (item) {
    menu.disableItemById(item)
  })

  $('#annotate-node-action').attr('disabled', 'disabled')
  $('#reroot-action').attr('disabled', 'disabled')
  $('#rotate-branch-action').attr('disabled', 'disabled')
  $('#select-descendants-action').attr('disabled', 'disabled')
  $('[data-direction]').attr('disabled', 'disabled')
  $('.mark-button').attr('disabled', 'disabled')
  $('#change-branch-color-action').attr('disabled', 'disabled')
  $('#remove-branch-color-action').attr('disabled', 'disabled')
  $('#set-mode-to-branch-action').attr('disabled', 'disabled')
  $('#set-mode-to-taxa-action').attr('disabled', 'disabled')
  $('#find-action').attr('disabled', 'disabled')
  $('#find-action').removeAttr('disabled')

  if (fangorn.tree_is_loaded()) {
    $('#set-mode-to-branch-action').removeAttr('disabled')
    $('#set-mode-to-taxa-action').removeAttr('disabled')
    $('[data-direction]').removeAttr('disabled')
    $('#open-fasta').removeAttr('disabled')
    $('#find-action').removeAttr('disabled')

    menu.enableItemById('open-fasta')
    menu.enableItemById('select-all')
    menu.enableItemById('find')
    menu.enableItemById('toggle-selection-mode')

    if (fangorn.fasta_is_loaded() && fangorn.is_one_leaf_selected()) { $('#annotate-node-action').removeAttr('disabled') }

    if (fangorn.is_one_selected()) {
      $('#reroot-action').removeAttr('disabled')
      menu.enableItemById('reroot')
    }

    if (fangorn.is_one_internal_selected()) {
      $('#rotate-branch-action').removeAttr('disabled')
      menu.enableItemById('rotate-branch')
      $('#select-descendants-action').removeAttr('disabled')
      menu.enableItemById('select-descendants')
    }

    if (fangorn.get_selection().length > 0) {
      $('#change-branch-color-action').removeAttr('disabled')
      $('#remove-branch-color-action').removeAttr('disabled')
    }

    if (fangorn.fasta_is_loaded() && fangorn.get_selected_leaves().length > 0) {
      $('.mark-button').removeAttr('disabled')
      menu.enableItemById('remove-selected')
      menu.enableItemById('remove-unselected')
      menu.enableItemById('restore-selected')
    }

    if (fangorn.fasta_is_loaded()) {
      $('#save-fasta-action').removeAttr('disabled')
      menu.enableItemById('save-fasta')
      menu.enableItemById('save-fasta-as')
    } else {
      $('#save-fasta-action').attr('disabled', 'disabled')
    }

    if (fangorn.get_selected_leaves_fasta()){
      menu.enableItemById('save-selection-as-fasta')
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
  var open_tree = function () {
    var options = {
      properties: ['openFile'],
      filters: [{ name: 'Tree files', extensions: TREE_EXT }, { name: 'All files', extensions: ['*'] }],
      title: 'Open tree'
    }

    dialog.showOpenDialog(options).then(result => {
      if (result.filePaths.length == 0) { return false }

      var path = result.filePaths[0]
      fangorn.load_tree_file(path)
    })
  }

  if (fangorn.tree_is_dirty){
    showUnsavedFileAlert(open_tree)
  } else {
    open_tree()
  }

  resetSelectionMode()
}

function getMode () {
  if (modeSelector) {
    return modeSelector.active_button.data('mode')
  }

  return undefined
}

function save_tree_action () {
  fangorn.save_tree()
}

function save_tree_as_action () {
  var options = { title: 'Save tree as...', defaultPath: fangorn.tree_path }
  dialog.showSaveDialog(options).then(result => {
    if (result.canceled || result.filePath.length === 0) { return true }

    fangorn.save_tree(result.filePath)

    var fasta_is_loaded = fangorn.fasta_is_loaded()
    var fasta_path = fasta_is_loaded && fangorn.fasta.path

    fangorn.load_tree_file(result.filePath)
    if (fasta_is_loaded) { fangorn.load_fasta_file(fasta_path, true) }
  })
}

function open_fasta_action () {
  var open_fasta = function () {
    var options = {
      properties: ['openFile'],
      filters: [{ name: 'Fasta files', extensions: FASTA_EXT }, { name: 'All files', extensions: ['*'] }],
      title: 'Open fasta file'
    }

    dialog.showOpenDialog(options).then(result => {
      if (result.filePaths.length === 0) { return false }

      var path = result.filePaths[0]
      fangorn.load_fasta_file(path)
    })
  }

  if (fangorn.fasta_is_dirty){
    showUnsavedFileAlert(open_fasta)
  } else
    open_fasta()

}

function copy_action () {
  if (!fangorn.tree_is_loaded()){
    return
  }

  var fasta = fangorn.get_selected_leaves_fasta()
  if (fasta) { clipboard.writeText(fasta) }
}

function toggle_selection_mode_action () {
  if ($('#set-mode-to-taxa-action').hasClass('active')) {
    $('#set-mode-to-branch-action').click()
  } else if ($('#set-mode-to-branch-action').hasClass('active')) {
    $('#set-mode-to-taxa-action').click()
  }
}

function remove_selected_action () {
  fangorn.get_selection().forEach(function (n) { n.mark() })
  fangorn.get_tree().refresh()
  fangorn.select_none()
  dispatchDocumentEvent('node_mark_status_changed')
}

function remove_unselected_action () {
  var selected = fangorn.get_selection()

  fangorn.get_leaves().forEach(function (l) {
    if (!selected.includes(l)) { l.mark() }
  })

  fangorn.get_tree().refresh()
  fangorn.select_none()
  dispatchDocumentEvent('node_mark_status_changed')
}

function restore_selected_action () {
  fangorn.get_selection().forEach(function (n) { n.unmark() })
  fangorn.get_tree().refresh()
  fangorn.select_none()
  dispatchDocumentEvent('node_mark_status_changed')
}

function save_fasta_action () {
  fangorn.save_fasta(null, function () {
    fangorn.load_fasta_file(fangorn.fasta.out_path, true)
  })
}

function save_fasta_as_action () {
  var options = { title: 'Save fasta as...', defaultPath: fangorn.fasta.out_path }

  dialog.showSaveDialog(options).then(result => {
    if (result.canceled || result.filePath.length === 0) { return true }

    fangorn.save_fasta(result.filePath, function () {
      fangorn.load_fasta_file(result.filePath, true)
    })
  })
}

function save_selection_as_fasta_action () {
  var fasta = fangorn.get_selected_leaves_fasta()

  if (!fasta) { return false }

  var options = { title: 'Save selection as fasta' }

  dialog.showSaveDialog(options).then(result => {
    if (result.canceled || result.filePath.length === 0) { return true }

    fs.writeFile(result.filePath, fasta, function (err) {
      if (err) {
        return console.error(err)
      }
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
  var header = node.fasta.header
  $('#seq-title-input').val(header)

  $('#annotate-dialog')[0].showModal()
}

function reroot_action () {
  fangorn.reroot_to_selected_node()
}

function rotate_branch_action () {
  fangorn.rotate_selected_branch()
}

function select_descendants_action () {
  fangorn.select_descendants_of_selected()
}

function export_to_png_action () {
  options = { fonts: [], scale: 1.5 }
  svgToPng.saveSvgAsPng(d3.select('svg#tree_display').node(), 'tree.png', options)
}

function export_to_svg_action () {
  options = { fonts: [] }
  svgToPng.saveSvg(d3.select('svg#tree_display').node(), 'tree.svg', options)
}

function remove_branch_color_action () {
  fangorn.set_selected_nodes_annotation({ '!color': undefined })
  fangorn.get_tree().dispatch_selection_modified_event() // for picker to reset color
}

function selectAllAction () {
  var mode = getMode()
  if (mode === 'taxa'){
    fangorn.select_all_leaves()
  } else if (mode === 'branch') {
    fangorn.select_all()
  }
}

function applyPreferences () {
  fangorn.get_tree().safe_update()
  fangorn.redraw_features()
}

function quitAction () {
  if (fangorn.has_dirty_files()){
    showUnsavedFileAlert((e) => app.remote.app.quit())
  } else
    app.remote.app.quit()
}

function resetSelectionMode () {
  $('#set-mode-to-taxa-action').click()
}

$(document).ready(function () {
  unhandled({ showDialog: true })

  Split(['#tree-pane', '#fasta-panel'], { gutterSize: 10, cursor: 'col-resize' })

  set_window_header()

  document.addEventListener('fangorn_state_update', function (e) {
    update_controls(fangorn)
  })

  fangorn = Fangorn()
  fangorn.dispatch_state_update()

  var fasta_pane = new FastaPane(fangorn)

  // *** Menu actions *** //

  // File
  menu.setCallbackOnItem('open-tree', open_tree_action)
  menu.setCallbackOnItem('save-tree', save_tree_action)
  menu.setCallbackOnItem('save-tree-as', save_tree_as_action)

  menu.setCallbackOnItem('open-fasta', open_fasta_action)
  menu.setCallbackOnItem('save-fasta', save_fasta_action)
  menu.setCallbackOnItem('save-fasta-as', save_fasta_as_action)
  menu.setCallbackOnItem('save-selection-as-fasta', save_selection_as_fasta_action)

  menu.setCallbackOnItem('export-to-png', export_to_png_action)
  menu.setCallbackOnItem('export-to-svg', export_to_svg_action)

  // Edit

  document.addEventListener('copy', function(e) {
    if (e.target.tagName == 'BODY'){
      copy_action()
      e.preventDefault()
    }
  })

  menu.setCallbackOnItem('toggle-selection-mode', toggle_selection_mode_action)
  menu.setCallbackOnItem('remove-selected', remove_selected_action)
  menu.setCallbackOnItem('remove-unselected', remove_unselected_action)
  menu.setCallbackOnItem('restore-selected', restore_selected_action)
  menu.setCallbackOnItem('select-all', selectAllAction)


  $('#remove-selected-action').on('click', remove_selected_action)
  $('#remove-unselected-action').on('click', remove_unselected_action)
  $('#restore-selected-action').on('click', restore_selected_action)


  $('#show-fasta-action').on('click', show_fasta_action)

  $('#annotate-node-action').on('click', annotate_node_action)

  $('#reroot-action').on('click', reroot_action)
  menu.setCallbackOnItem('reroot', reroot_action)

  $('#rotate-branch-action').on('click', rotate_branch_action)
  menu.setCallbackOnItem('rotate-branch', rotate_branch_action)

  $('#select-descendants-action').on('click', select_descendants_action)
  menu.setCallbackOnItem('select-descendants', select_descendants_action)

  menu.setCallbackOnItem('quit', quitAction)

  $('#annotation-dialog-cancel').on('click', function () {
    $('#seq-title-input').val('')
    $('#annotate-dialog')[0].close(false)
  })

  $('#annotation-dialog-save').on('click', function () {
    var node = fangorn.get_selection()[0]
    fangorn.update_node_title(node, $('#seq-title-input').val())
    $('#seq-title-input').val('')
    $('#annotate-dialog')[0].close(false)
  })

  $('#universal-dialog-close').on('click', function () {
    $('#universal-dialog')[0].close(false)
  })

  $('[data-direction]').on('click', function () {
    var which_function = $(this).data('direction') == 'vertical' ? fangorn.get_tree().spacing_x : fangorn.get_tree().spacing_y
    which_function(which_function() + (+$(this).data('amount'))).safe_update()
    fangorn.get_tree().redraw_scale_bar()
  })

  // Picker logic

  var picker = new ColorPicker('#branch-color-picker', '#change-branch-color-action', ['#change-branch-color-box'])
  picker.add_color_change_callback(function (color) {
    fangorn.set_selected_nodes_annotation({ "!color": color })
  })

  document.addEventListener('selection_modified', function (e) {
    var selection = fangorn.get_selection()

    if (selection.length === 1) {
      var color = selection[0].parsed_annotation['!color']

      if (color) {
        picker.set_color(color)
      } else {
        picker.remove_color()
      }
    } else if (selection.length > 1) {
      var set = new Set(selection.map((e) => { return e.parsed_annotation.color }))
      var first_color = set.values().next().value

      if (set.size === 1 && first_color !== undefined){
        picker.set_color(first_color)
      } else {
        picker.remove_color()
      }
    } else {
      picker.remove_color()
    }
  })

  $('#remove-branch-color-action').on('click', remove_branch_color_action)

  // Preferences logic

  document.addEventListener('preferences_update', applyPreferences)

  ipcRenderer.on('give_current_prefs', (event, message) => {
    ipcRenderer.send('take_current_prefs', fangorn.preferences || {})
  })

  ipcRenderer.on('take_new_prefs', (event, message) => {
    if (fangorn.preferences) { fangorn.apply_new_preferences(message) }
    ipcRenderer.send('new_preferences_taken')
  })

  ipcRenderer.on('open_file', (event, message) => {
    var open_tree = function () {
      fangorn.load_tree_file(message)
    }

    if (fangorn.tree_is_dirty){
      showUnsavedFileAlert(open_tree)
    } else {
      open_tree()
    }
  })

  // Selection modes logic

  modeSelector = new BtnGroupRadio($('#mode-select-btn-group'))

  modeSelector.on_change = (new_button) => {
    var mode = $(new_button).data('mode')
    if (!fangorn.tree_is_loaded()) { return false }

    fangorn.select_none()
    fangorn.get_tree().set_selection_mode(mode)
  }

  resetSelectionMode()

  // Search panel

  var search_panel = new SearchPanel($('#search-panel'), fangorn, fasta_pane)

  menu.setCallbackOnItem('find', function () {
    search_panel.toggle()
  })

  // Footer text

  document.addEventListener('new_tree_is_loaded', () => {
    $("#footer-text").show()
  })

  // Header update logic

  document.addEventListener('fangorn_tree_header_update', (e) => {
    set_window_header(fangorn.tree_title())
  })

  // Key bindings

  document.addEventListener('keydown', (e) => {
    if (e.keyCode === 13) {
      $('dialog.modal-dialog:visible').each((i, el) => {
        $(el).find('.enter-action').click()
      })
    }
  })

  ipcRenderer.send('scripts_loaded')
})
