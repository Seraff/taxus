const Split = window.modules.splitjs

// const unhandled = require('electron-unhandled');

let taxus = null
let modeSelector = null
let progressBar = null
let controls = null

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
    .register('show_fasta', undefined, '#show-fasta-action')

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
    controls.enableItem('show_fasta')

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

  let menuStates = controls.menuStateDict()
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
  let header = 'Taxus'

  if (text) { header += ' — ' + text }

  $('h1#window-header').html(header)
  // TODO header to backend
}

async function openTreeAction (e) {

  let openTree = async function () {
    let options = {
      properties: ['openFile'],
      filters: [
        { name: 'Tree files', extensions: Taxus.TREE_EXT },
        { name: 'All files', extensions: ['*'] }],
      title: 'Open tree'
    }

    window.api.openFileDialog(options).then(path => {
      progressBar.show()
      taxus.load_tree_file(path, () => {
        progressBar.hide()
        progressBar.setNewComplexity(taxus.get_nodes().length)
      })
    })
  }

  if (taxus.tree_is_dirty || taxus.fasta_is_dirty){
    showUnsavedFileAlert(openTree)
  } else {
    openTree()
  }

  resetSelectionMode()
}

function saveTreeAction () {
  taxus.save_tree()
}

function saveTreeAsAction () {
  let options = {
    title: 'Save tree as...',
    defaultPath: taxus.tree_path }

  window.api.saveFileDialog(options).then(path => {
    taxus.save_tree(path)

    let fasta_is_loaded = taxus.fasta_is_loaded()
    let fasta_path = fasta_is_loaded && taxus.fasta.path

    taxus.load_tree_file(result.filePath)
    if (fasta_is_loaded) { taxus.load_fasta_file(fasta_path, true) }
  })
}

function openFastaAction () {
  let open_fasta = function () {
    let options = {
      properties: ['openFile'],
      filters: [{ name: 'Fasta files', extensions: Taxus.FASTA_EXT }, { name: 'All files', extensions: ['*'] }],
      title: 'Open fasta file'
    }

    window.api.openFileDialog(options).then(path => {
      taxus.load_fasta_file(path)
    })
  }

  if (taxus.fasta_is_dirty){
    showUnsavedFileAlert(open_fasta)
  } else
    open_fasta()
}

function saveFastaAction() {
  console.log('save fasta action in scripts.js')
  taxus.save_fasta(null, function () {
    taxus.load_fasta_file(taxus.fasta_out_path(), true)
  })
}

function saveFastaAsAction() {
  let options = { title: 'Save fasta as...', defaultPath: taxus.fasta_out_path() }

  dialog.showSaveDialog(options).then(result => {
    if (result.canceled || result.filePath.length === 0) { return true }

    taxus.save_fasta(result.filePath, function () {
      taxus.load_fasta_file(result.filePath, true)
    })
  })
}

function copyAction () {
  if (!taxus.tree_is_loaded()){
    return
  }

  let fasta = taxus.get_selected_leaves_fasta()
  if (fasta) { clipboard.writeText(fasta) }
}

function toggleSelectionModeAction () {
  mode = modeSelector.active_button.data('mode')
  new_mode = mode == 'taxa' ? 'branch' : 'taxa'
  setMode(new_mode)
}

function setModeToTaxaAction() {
  setMode('taxa')
}

function setModeToBranchAction() {
  setMode('branch')
}

function removeSelectedAction() {
  taxus.get_selection().forEach(function (n) { n.mark() })
  taxus.get_tree().refresh()
  taxus.select_none()
  dispatchDocumentEvent('node_mark_status_changed')
}

function removeUnselectedAction() {
  let selected = taxus.get_selection()

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

function saveSelectionAsFastaAction() {
  // TODO: make it properly
  let fasta = taxus.get_selected_leaves_fasta()

  if (!fasta) { return false }

  let options = { title: 'Save selection as fasta' }

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
  if (!taxus.fasta_is_loaded() || taxus.get_selection().length != 1) { return false }

  let node = taxus.get_selection()[0]
  let header = node.fasta().header
  $('#seq-title-input').val(header)

  $('#annotate-dialog')[0].showModal()
}

function rerootAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.rerootToSelectedNode()
  })
}

function rotateBranchAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.rotateSelectedBranch()
  })
}

function selectDescendantsAction() {
  taxus.selectDescendants()
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

function selectAllAction() {
  let mode = getMode()
  if (mode === 'taxa'){
    taxus.select_all_leaves()
  } else if (mode === 'branch') {
    taxus.select_all()
  }
}

function toggleCladogramViewAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.toggleCladogramView()
  })
}

function quitAction() {
  if (taxus.has_dirty_files()){
    showUnsavedFileAlert((e) => app.remote.app.quit())
  } else
    app.remote.app.quit()
}

function zoomInAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.get_tree().zoomIn()
  })
}

function zoomOutAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.get_tree().zoomOut()
  })
}

function horizontalContractAction() {
  func = taxus.get_tree().spacing_y
  amount = -10
  changeScale(func, amount)
}

function horizontalExpandAction() {
  func = taxus.get_tree().spacing_y
  amount = 10
  changeScale(func, amount)
}

function verticalContractAction() {
  func = taxus.get_tree().spacing_x
  amount = -10
  changeScale(func, amount)
}

function verticalExpandAction() {
  func = taxus.get_tree().spacing_x
  amount = 10
  changeScale(func, amount)
}

function getMode() {
  if (modeSelector) {
    return modeSelector.active_button.data('mode')
  }

  return undefined
}

function setMode(new_mode) {
  if (taxus.tree_is_loaded())
    taxus.get_tree().set_selection_mode(new_mode)

  let btn = modeSelector.buttons.filter((i, b) => {
    return $(b).data('mode') == new_mode
  }).get(0)

  modeSelector.makeActive(btn)
}

function resetSelectionMode() {
  setMode('taxa')
}

function changeScale(func, amount){
  progressBar.withProgressBarAttempt(() => {
    func(func() + amount).safe_update()
    taxus.get_tree().redraw_scale_bar()
    dispatchDocumentEvent('tree_topology_changed')
  })
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

  document.addEventListener('taxus_state_update', function (e) {
    updateControls(taxus)
  })

  taxus = new Taxus()

  let controls = initControls()
  updateControls()

  let fasta_pane = new FastaPane(taxus)

  // Selection modes logic

  modeSelector = new BtnGroupRadio($('#mode-select-btn-group'))
  resetSelectionMode()


  progressBar = new ProgressBarManager()

  // Preferences logic

  // window.api.handleGetPreferences(() => {
  //   console.log('Main window handles request for current preferences')
  //   window.api.
  // })

  // document.addEventListener('preferences_update', applyPreferences)

  window.api.handleGiveCurrentPrefs((event, message) => {
    console.log('They asked for current prefs')
    window.api.takeCurrentPrefs(taxus.preferences || {})
  })

  window.api.handleTakeNewPrefs((event, prefs) => {
    console.log('Receiving new preferences')
    if (taxus.preferences)
      taxus.apply_new_preferences(prefs)
    window.api.newPrefsTaken()
  })

  return

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
    let node = taxus.get_selection()[0]
    taxus.update_node_title(node, $('#seq-title-input').val())
    dispatchDocumentEvent('node_titles_changed')
    $('#seq-title-input').val('')
    $('#annotate-dialog')[0].close(false)
  })

  $('#universal-dialog-close').on('click', function () {
    $('#universal-dialog')[0].close(false)
  })

  // Picker logic

  let picker = new ColorPicker('#branch-color-picker', '#change-branch-color-action', ['#change-branch-color-box'])
  picker.add_color_change_callback(function (color) {
    taxus.set_selected_nodes_annotation({ "!color": color })
  })

  document.addEventListener('selection_modified', function (e) {
    let selection = taxus.get_selection()

    if (selection.length === 1) {
      let color = selection[0].parsed_annotation['!color']

      if (color) {
        picker.set_color(color)
      } else {
        picker.remove_color()
      }
    } else if (selection.length > 1) {
      let set = new Set(selection.map((e) => { return e.parsed_annotation.color }))
      let first_color = set.values().next().value

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


  ipcRenderer.on('open_file', (event, message) => {
    let open_tree = function () {
      taxus.load_tree_file(message)
    }

    if (taxus.tree_is_dirty || taxus.fasta_is_dirty){
      showUnsavedFileAlert(open_tree)
    } else {
      open_tree()
    }
  })

  // Search panel

  let search_panel = new SearchPanel($('#search-panel'), taxus, fasta_pane)

  menu.setCallbackOnItem('find', function () {
    search_panel.toggle()
  })

  // Footer text

  document.addEventListener('new_tree_is_loaded', () => {
    $("#footer-text").show()
    printTaxaCount()
  })

  // Header update logic

  document.addEventListener('taxus_tree_header_update', (e) => {
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
