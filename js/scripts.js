const Split = window.modules.splitjs

// const unhandled = require('electron-unhandled');

var taxus = null
var modeSelector = null
var progressBar = null
var controls = null

function initControls() {
  controls = new Controls()

  // Control callback should be named like
  // system_name: some_item
  // callback: someItemAction

  controls
    // Only menu
    .register('open_tree', 'open-tree', undefined)
    .register('save_tree', 'save-tree', undefined)
    .register('save_tree_as', 'save-tree-as', undefined)
    .register('open_fasta', 'open-fasta', undefined)
    .register('save_fasta', 'save-fasta', undefined)
    .register('save_fasta_as', 'save-fasta-as', undefined)
    .register('save_selection_as_fasta', 'save-selection-as-fasta', undefined)
    .register('select_all', 'select-all', undefined)
    .register('toggle_selection_mode', 'toggle-selection-mode', undefined)
    .register('toggle_cladogram_view', 'toggle-cladogram-view', undefined)
    // Both menu and button
    .register('reroot', 'reroot', '#reroot-action')
    .register('rotate_branch', 'rotate-branch', '#rotate-branch-action')
    .register('select_descendants', 'select-descendants', '#select-descendants-action')
    .register('remove_selected', 'remove-selected', '#remove-selected-action')
    .register('remove_unselected', 'remove-unselected', '#remove-unselected-action')
    .register('restore_selected', 'restore-selected', '#restore-selected-action')
    .register('find', 'find', '#find-action')
    .register('zoom_in', 'zoom-in', '#zoom-in-action')
    .register('zoom_out', 'zoom-out', '#zoom-out-action')
    // Only button
    .register('annotate_node', undefined, '#annotate-node-action')
    .register('horizontal_contract', undefined, '#horizontal-contract-action')
    .register('horizontal_expand', undefined, '#horizontal-expand-action')
    .register('vertical_contract', undefined, '#vertical-contract-action')
    .register('vertical_expand', undefined, '#vertical-expand-action')
    .register('change_branch_color', undefined, '#change-branch-color-action')
    .register('remove_branch_color', undefined, '#remove-branch-color-action')
    .register('set_mode_to_branch', undefined, '#set-mode-to-branch-action')
    .register('set_mode_to_taxa', undefined, '#set-mode-to-taxa-action')
    .register('set_search_mode_to_fasta', undefined, '#set-search-mode-to-fasta')

  // controls.setCallback('open_fasta', openFastaAction)
  window.api.onMenuClicked((event, itemId) => {
    controls.runMenuCallback(itemId)
  })

  return controls
}

function updateControls () {
  controls.disableAll()

  controls.enableItem('open_tree')

  if (taxus.tree_is_loaded()) {
    controls.enableItem('save_tree')
    controls.enableItem('save_tree_as')

    controls.enableItem('open_fasta')
    controls.enableItem('select_all')
    controls.enableItem('toggle_selection_mode')
    controls.enableItem('toggle_cladogram_view')

    controls.enableItem('zoom_in')
    controls.enableItem('zoom_out')
    controls.enableItem('find')

    controls.enableItem('set_mode_to_branch')
    controls.enableItem('set_mode_to_taxa')
    controls.enableItem('horizontal_contract')
    controls.enableItem('horizontal_expand')
    controls.enableItem('vertical_contract')
    controls.enableItem('vertical_expand')


    if (taxus.fasta_is_loaded() && taxus.is_one_leaf_selected()) {
      controls.enableItem('annotate_node')
    }

    if (taxus.is_one_selected()) {
      controls.enableItem('reroot')
    }

    if (taxus.is_one_internal_selected()) {
      controls.enableItem('rotate_branch')
    }

    if (taxus.is_any_interlal_selected()) {
      controls.enableItem('select_descendants')
    }

    if (taxus.get_selection().length > 0) {
      controls.enableItem('change_branch_color')
      controls.enableItem('remove_branch_color')
    }

    if (taxus.fasta_is_loaded() && taxus.get_selected_leaves().length > 0) {
      controls.enableItem('remove_selected')
      controls.enableItem('remove_unselected')
      controls.enableItem('restore_selected')
    }

    if (taxus.fasta_is_loaded()) {
      controls.enableItem('save_fasta')
      controls.enableItem('save_fasta_as')

      controls.enableItem('set_search_mode_to_fasta')
    }

    if (taxus.get_selected_leaves_fasta()){
      controls.enableItem('save_selection_as_fasta')
    }
  }

  var menuStates = controls.menuStateDict()
  window.api.updateMenu(menuStates)
}

function showAlert (title, body) {
  $('#universal-dialog').find('.title').html(title)
  $('#universal-dialog').find('.modal-body').html(body)
  $('#universal-dialog')[0].showModal()
}

function showLogAlert (title, subtitle, rows) {
  $('#universal-dialog').find('.title').html(title)

  $('#universal-dialog').find('.modal-body').html('')
  $('#universal-dialog').find('.modal-body').append(subtitle)
  $('#universal-dialog').find('.modal-body').append('<div id="log_body" style="overflow-y: auto; max-height: 200px; border: none;"></div>')

  rows.forEach(function (r) { $('#log_body').append(r + '</br>') })

  $('#universal-dialog')[0].showModal()
}

function setWindowHeader (text = null) {
  var header = 'Taxus'

  if (text) { header += ' — ' + text }

  $('h1#window-header').html(header)
  // TODO header to backend
}

async function openTreeAction (e) {

  var openTree = async function () {
    var options = {
      properties: ['openFile'],
      filters: [
        { name: 'Tree files', extensions: Taxus.TREE_EXT },
        { name: 'All files', extensions: ['*'] }],
      title: 'Open tree'
    }

    window.api.openFileDialog(options).then(path => {
      taxus.load_tree_file(path)
    })

    // TODO progressbar
    // dialog.showOpenDialog(options).then(result => {
    //   if (result.filePaths.length == 0) {
    //     return false
    //   }

    //   progressBar.withProgressBar(() => {

    //     taxus.load_tree_file(path)

    //     progressBar.setNewComplexity(taxus.get_nodes().length)
    //   })

    // })
  }

  if (taxus.tree_is_dirty || taxus.fasta_is_dirty){
    showUnsavedFileAlert(openTree)
  } else {
    openTree()
  }

  resetSelectionMode()
}

function getMode () {
  if (modeSelector) {
    return modeSelector.active_button.data('mode')
  }

  return undefined
}

function saveTreeAction () {
  taxus.save_tree()
}

function saveTreeAsAction () {
  var options = {
    title: 'Save tree as...',
    defaultPath: taxus.tree_path }

  window.api.saveFileDialog(options).then(path => {
    taxus.save_tree(path)

    var fasta_is_loaded = taxus.fasta_is_loaded()
    var fasta_path = fasta_is_loaded && taxus.fasta.path

    taxus.load_tree_file(result.filePath)
    if (fasta_is_loaded) { taxus.load_fasta_file(fasta_path, true) }
  })
}

function openFastaAction () {
  var open_fasta = function () {
    var options = {
      properties: ['openFile'],
      filters: [{ name: 'Fasta files', extensions: Taxus.FASTA_EXT }, { name: 'All files', extensions: ['*'] }],
      title: 'Open fasta file'
    }

    dialog.showOpenDialog(options).then(result => {
      if (result.filePaths.length === 0) { return false }

      var path = result.filePaths[0]
      taxus.load_fasta_file(path)
    })
  }

  if (taxus.fasta_is_dirty){
    showUnsavedFileAlert(open_fasta)
  } else
    open_fasta()

}

function copyAction () {
  if (!fangorn.tree_is_loaded()){
    return
  }

  var fasta = taxus.get_selected_leaves_fasta()
  if (fasta) { clipboard.writeText(fasta) }
}

function toggleSelectionModeAction () {
  if ($('#set-mode-to-taxa-action').hasClass('active')) {
    $('#set-mode-to-branch-action').click()
  } else if ($('#set-mode-to-branch-action').hasClass('active')) {
    $('#set-mode-to-taxa-action').click()
  }
}

function setModeToTaxaAction() {

}

function setModeToBranchAction() {

}

function removeSelectedAction() {
  taxus.get_selection().forEach(function (n) { n.mark() })
  taxus.get_tree().refresh()
  taxus.select_none()
  dispatchDocumentEvent('node_mark_status_changed')
}

function removeUnselectedAction() {
  var selected = taxus.get_selection()

  taxus.get_leaves().forEach(function (l) {
    if (!selected.includes(l)) { l.mark() }
  })

  taxus.get_tree().refresh()
  taxus.select_none()
  dispatchDocumentEvent('node_mark_status_changed')
}

function restoreSelectedAction() {
  taxus.get_selection().forEach(function (n) { n.unmark() })
  taxus.get_tree().refresh()
  taxus.select_none()
  dispatchDocumentEvent('node_mark_status_changed')
}

function saveFastaAction() {
  taxus.save_fasta(null, function () {
    taxus.load_fasta_file(taxus.fasta_out_path(), true)
  })
}

function saveFastaAsAction() {
  var options = { title: 'Save fasta as...', defaultPath: taxus.fasta_out_path() }

  dialog.showSaveDialog(options).then(result => {
    if (result.canceled || result.filePath.length === 0) { return true }

    taxus.save_fasta(result.filePath, function () {
      taxus.load_fasta_file(result.filePath, true)
    })
  })
}

function saveSelectionAsFastaAction() {
  // TODO: make it properly
  var fasta = taxus.get_selected_leaves_fasta()

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

function showFastaAction() {
  if ($('#fasta-panel').is(':hidden')) {
    $('#fasta-panel').show()
    $('#show-fasta-action').addClass('btn-pressed')
  } else {
    $('#fasta-panel').hide()
    $('#show-fasta-action').removeClass('btn-pressed')
  }
}

function annotateNodeAction() {
  if (!fangorn.fasta_is_loaded() || taxus.get_selection().length != 1) { return false }

  var node = taxus.get_selection()[0]
  var header = node.fasta().header
  $('#seq-title-input').val(header)

  $('#annotate-dialog')[0].showModal()
}

function rerootAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.reroot_to_selected_node()
  })
}

function rotateBranchAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.rotate_selected_branch()
  })
}

function selectDescendantsAction() {
  taxus.select_descendants_of_selected()
}

function exportToPngAction() {
  bbox = taxus.get_tree().phylotree_navigator.getTreeScreenBBox()
  options = { fonts: [], left: bbox.x, top: bbox.y, height: bbox.height, width: bbox.width }
  svgToPng.saveSvgAsPng(d3.select('svg#tree_display').node(), 'tree.png', options)
}

function exportToSvgAction() {
  bbox = taxus.get_tree().phylotree_navigator.getTreeScreenBBox()
  options = { fonts: [], left: bbox.x, top: bbox.y, height: bbox.height, width: bbox.width }
  svgToPng.saveSvg(d3.select('svg#tree_display').node(), 'tree.svg', options)
}

function removeBranchColorAction() {
  taxus.set_selected_nodes_annotation({ '!color': undefined })
  taxus.get_tree().dispatch_selection_modified_event() // for picker to reset color
}

function selectAllAction () {
  var mode = getMode()
  if (mode === 'taxa'){
    taxus.select_all_leaves()
  } else if (mode === 'branch') {
    taxus.select_all()
  }
}

function toggleCladogramViewAction () {
  progressBar.withProgressBarAttempt(() => {
    taxus.toggleCladogramView()
  })
}

function applyPreferences () {
  taxus.get_tree().safe_update()
  taxus.redraw_features()
}

function quitAction () {
  if (taxus.has_dirty_files()){
    showUnsavedFileAlert((e) => app.remote.app.quit())
  } else
    app.remote.app.quit()
}

function zoomInAction () {
  taxus.get_tree().zoomIn()
}

function zoomOutAction () {
  taxus.get_tree().zoomOut()
}

function resetSelectionMode () {
  $('#set-mode-to-taxa-action').click()
}

function printTaxaCount () {
  cnt = taxus.get_leaves().length
  printMetaInfo(cnt + ' taxa')
}

function printMetaInfo (msg) {
  $('#footer-meta').html(msg)
}

$(document).ready(function () {
  // unhandled({ showDialog: true })

  Split(['#tree-pane', '#fasta-panel'], { gutterSize: 10, cursor: 'col-resize' })

  setWindowHeader()

  document.addEventListener('fangorn_state_update', function (e) {
    updateControls(taxus)
  })

  taxus = new Taxus()

  // $('#annotate-node-action').on('click', async () => { // DEBUGGING
  //   open_tree_action()
  // }) // DEBUGGING

  var controls = initControls()

  updateControls()

  $('button').on('click', function () { this.blur() })

  var fasta_pane = new FastaPane(taxus)

  return


  // progressBar = new ProgressBarManager()

  // Edit

  document.addEventListener('copy', function(e) {
    if (e.target.tagName == 'BODY'){
      copyAction()
      e.preventDefault()
    }
  })

  $('#annotation-dialog-cancel').on('click', function () {
    $('#seq-title-input').val('')
    $('#annotate-dialog')[0].close(false)
  })

  $('#annotation-dialog-save').on('click', function () {
    var node = taxus.get_selection()[0]
    taxus.update_node_title(node, $('#seq-title-input').val())
    dispatchDocumentEvent('node_titles_changed')
    $('#seq-title-input').val('')
    $('#annotate-dialog')[0].close(false)
  })

  $('#universal-dialog-close').on('click', function () {
    $('#universal-dialog')[0].close(false)
  })

  $('.expand-contract-action').on('click', function () {
    var which_function = $(this).data('direction') == 'vertical' ? taxus.get_tree().spacing_x : taxus.get_tree().spacing_y

    progressBar.withProgressBarAttempt(() => {
      which_function(which_function() + (+$(this).data('amount'))).safe_update()
      taxus.get_tree().redraw_scale_bar()
    })

    dispatchDocumentEvent('tree_topology_changed')
  })

  // Picker logic

  var picker = new ColorPicker('#branch-color-picker', '#change-branch-color-action', ['#change-branch-color-box'])
  picker.add_color_change_callback(function (color) {
    taxus.set_selected_nodes_annotation({ "!color": color })
  })

  document.addEventListener('selection_modified', function (e) {
    var selection = taxus.get_selection()

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

  $('#remove-branch-color-action').on('click', removebranchcoloraction)

  // Preferences logic

  document.addEventListener('preferences_update', applyPreferences)

  ipcRenderer.on('give_current_prefs', (event, message) => {
    ipcRenderer.send('take_current_prefs', taxus.preferences || {})
  })

  ipcRenderer.on('take_new_prefs', (event, message) => {
    if (taxus.preferences) { taxus.apply_new_preferences(message) }
    ipcRenderer.send('new_preferences_taken')
  })

  ipcRenderer.on('open_file', (event, message) => {
    var open_tree = function () {
      taxus.load_tree_file(message)
    }

    if (taxus.tree_is_dirty || taxus.fasta_is_dirty){
      showUnsavedFileAlert(open_tree)
    } else {
      open_tree()
    }
  })

  // Selection modes logic

  modeSelector = new BtnGroupRadio($('#mode-select-btn-group'))

  modeSelector.on_change = (new_button) => {
    if (!fangorn.tree_is_loaded()) {
      return false
    }

    var $btn = $(new_button)
    var mode = $btn.data('mode')

    taxus.get_tree().set_selection_mode(mode)
    $btn.blur()
  }

  resetSelectionMode()

  // Search panel

  var search_panel = new SearchPanel($('#search-panel'), taxus, fasta_pane)

  menu.setCallbackOnItem('find', function () {
    search_panel.toggle()
  })

  // Footer text

  document.addEventListener('new_tree_is_loaded', () => {
    $("#footer-text").show()
    printTaxaCount()
  })

  // Header update logic

  document.addEventListener('fangorn_tree_header_update', (e) => {
    setWindowHeader(taxus.tree_title())
  })

  // Key bindings

  document.addEventListener('keydown', (e) => {
    if (e.keyCode === 13) {
      $('dialog.modal-dialog:visible').each((i, el) => {
        $(el).find('.enter-action').click()
      })
    }
  })

  // Windows/Linux tweaks

  if (process.platform !== 'darwin') {
    $('#window-header').hide()
  }

  ipcRenderer.send('scripts_loaded')
})
