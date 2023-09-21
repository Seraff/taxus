const Split = window.modules.splitjs
const svgToPng = window.modules.svgToPng

// const unhandled = require('electron-unhandled');

let taxus = null
let modeSelector = null
let progressBar = null
let controls = null
let search_panel = null

function initControls() {
  controls = new Controls()

  // Control callback should be named like
  // system_name: some_item
  // callback: someItemAction

  controls
    // Only menu
    .register('preferences', 'preferences', undefined)
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
    .register('close', 'close', undefined)
    .register('quit', 'quit', undefined)
    .register('order_ascending', 'order-ascending', undefined)
    .register('order_descending', 'order-descending', undefined)
    .register('order_original', 'order-original', undefined)
    .register('export_to_svg', 'export-to-svg', undefined)
    .register('export_to_png', 'export-to-png', undefined)
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
  controls.enableItem('close')
  controls.enableItem('quit')

  if (taxus.treeIsLoaded()) {
    controls.enableItem('preferences')
    controls.enableItem('save_tree')
    controls.enableItem('save_tree_as')
    controls.enableItem('export_to_svg')
    controls.enableItem('export_to_png')

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

    controls.enableItem('order_ascending')
    controls.enableItem('order_descending')
    controls.enableItem('order_original')


    if (taxus.fastaIsLoaded() && taxus.isOneLeafSelected()) {
      controls.enableItem('annotate_node')
    }

    if (taxus.isOneSelected()) {
      controls.enableItem('reroot')
    }

    if (taxus.isOneInternalSelected()) {
      controls.enableItem('rotate_branch')
    }

    if (taxus.isAnyInterlalSelected()) {
      controls.enableItem('select_descendants')
    }

    if (taxus.getSelection().length > 0) {
      controls.enableItem('change_branch_color')
      controls.enableItem('remove_branch_color')
    }

    if (taxus.fastaIsLoaded() && taxus.getSelectedLeaves().length > 0) {
      controls.enableItem('remove_selected')
      controls.enableItem('remove_unselected')
      controls.enableItem('restore_selected')
    }

    if (taxus.fastaIsLoaded()) {
      controls.enableItem('save_fasta')
      controls.enableItem('save_fasta_as')

      controls.enableItem('set_search_mode_to_fasta')
    }

    if (taxus.getSelectedLeavesFasta()){
      controls.enableItem('save_selection_as_fasta')
    }
  }

  let menuStates = controls.menuStateDict()
  window.api.updateMenu(menuStates)
}

function setWindowHeader (text = null) {
  let header = 'Taxus'

  if (text) { header += ' — ' + text }

  $('h1#window-header').html(header)
  window.api.setTitle(header)
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
      if (path){
        progressBar.show()
        taxus.loadTreeFile(path, {
            success: () => {
              progressBar.setNewComplexity(taxus.getNodes().length)
            },
            after: () => {
              progressBar.hide()
            }
          }
        )
      }
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
  taxus.saveTree()
}

function saveTreeAsAction () {
  let options = {
    title: 'Save tree as...',
    defaultPath: taxus.tree_path }

  window.api.saveFileDialog(options).then(path => {
    if (path){
      taxus.saveTree(path)

      let fasta_is_loaded = taxus.fastaIsLoaded()
      let fasta_path = fasta_is_loaded && taxus.fasta.path

      progressBar.show()
      taxus.loadTreeFile(path, {
        success: () => {
          if (fasta_is_loaded) { taxus.loadFastaFile(fasta_path, true) }
        },
        after: () => {
          progressBar.hide()
        }
      })
    }
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
      if (path){
        taxus.loadFastaFile(path)
      }
    })
  }

  if (taxus.fasta_is_dirty){
    showUnsavedFileAlert(open_fasta)
  } else
    open_fasta()
}

function saveFastaAction() {
  console.log('save fasta action in scripts.js')
  taxus.saveFasta(null, function () {
    taxus.loadFastaFile(taxus.fastaOutPath(), true)
  })
}

function saveFastaAsAction() {
  let options = { title: 'Save fasta as...',
                  defaultPath: taxus.fastaOutPath() }

  window.api.saveFileDialog(options).then(path => {
    if (path){
      taxus.saveFasta(path, function () {
        taxus.loadFastaFile(path, true)
      })
    }
  })
}

function toggleSelectionModeAction () {
  mode = modeSelector.active_button.data('mode')
  new_mode = mode == 'taxa' ? 'branch' : 'taxa'
  setMode(new_mode)
  dispatchDocumentEvent('selection_modified')
}

function setModeToTaxaAction() {
  setMode('taxa')
  dispatchDocumentEvent('selection_modified')
}

function setModeToBranchAction() {
  setMode('branch')
  dispatchDocumentEvent('selection_modified')
}

function removeSelectedAction() {
  taxus.getSelection().forEach(function (n) { n.mark() })
  taxus.getTree().refresh()
  taxus.selectNone()
  dispatchDocumentEvent('node_mark_status_changed')
}

function removeUnselectedAction() {
  let selected = taxus.getSelection()

  taxus.getLeaves().forEach(function (l) {
    if (!selected.includes(l)) { l.mark() }
  })

  taxus.getTree().refresh()
  taxus.selectNone()
  dispatchDocumentEvent('node_mark_status_changed')
}

function restoreSelectedAction() {
  taxus.getSelection().forEach(function (n) { n.unmark() })
  taxus.getTree().refresh()
  taxus.selectNone()
  dispatchDocumentEvent('node_mark_status_changed')
}

function saveSelectionAsFastaAction() {
  let fasta = taxus.getSelectedLeavesFasta()
  if (!fasta) { return false }

  let options = { title: 'Save selection as fasta' }

  window.api.saveFileDialog(options).then(path => {
    if (path){
      window.api.saveFile(path, fasta).then(() => {}, error => {
        console.error(error)
      })
    }
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
  if (!taxus.fastaIsLoaded() || taxus.getSelection().length != 1) { return false }

  let node = taxus.getSelection()[0]
  let header = node.fasta().header

  window.api.openAnnotationWindow({'name': header})
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
  bbox = taxus.getTree().phylotree_navigator.getTreeScreenBBox()
  options = { fonts: [], left: bbox.x, top: bbox.y, height: bbox.height, width: bbox.width }
  svgToPng.saveSvgAsPng(d3.select('svg#tree_display').node(), 'tree.png', options)
}

function exportToSvgAction() {
  bbox = taxus.getTree().phylotree_navigator.getTreeScreenBBox()
  options = { fonts: [], left: bbox.x, top: bbox.y, height: bbox.height, width: bbox.width }
  svgToPng.saveSvg(d3.select('svg#tree_display').node(), 'tree.svg', options)
}

function changeBranchColorAction() {}

function removeBranchColorAction() {
  let mode = modeSelector.active_button.data('mode')
  let attribute = mode === 'branch' ? "parsed_annotation" : "parsed_taxablock_annotation"
  taxus.setSelectedNodesAnnotation({ '!color': undefined }, attribute)
  taxus.getTree().dispatch_selection_modified_event() // for picker to reset color
}

function selectAllAction() {
  let mode = getMode()
  if (mode === 'taxa'){
    taxus.selectAllLeaves()
  } else if (mode === 'branch') {
    taxus.selectAll()
  }
}

function toggleCladogramViewAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.toggleCladogramView()
  })
}

function quitAction() {
  window.api.quit()
}

function zoomInAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.getTree().zoomIn()
  })
}

function zoomOutAction() {
  progressBar.withProgressBarAttempt(() => {
    taxus.getTree().zoomOut()
  })
}

function horizontalContractAction() {
  func = taxus.getTree().spacing_y
  amount = -10
  changeScale(func, amount)
}

function horizontalExpandAction() {
  func = taxus.getTree().spacing_y
  amount = 10
  changeScale(func, amount)
}

function verticalContractAction() {
  func = taxus.getTree().spacing_x
  amount = -10
  changeScale(func, amount)
}

function verticalExpandAction() {
  func = taxus.getTree().spacing_x
  amount = 10
  changeScale(func, amount)
}

function findAction() {
  search_panel.toggle()
}

function orderAscendingAction(){
  taxus.orderNodes('ASC')
}

function orderDescendingAction(){
  taxus.orderNodes('DESC')
}

function orderOriginalAction(){
  taxus.orderNodes('ORIGINAL')
}

function getMode() {
  if (modeSelector) {
    return modeSelector.active_button.data('mode')
  }

  return undefined
}

function setMode(new_mode) {
  if (taxus.treeIsLoaded())
    taxus.getTree().set_selection_mode(new_mode)

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
    taxus.getTree().redraw_scale_bar()
    dispatchDocumentEvent('tree_topology_changed')
  })
}

function printTaxaCount () {
  let cnt = taxus.getLeaves().length
  let selectedCnt = taxus.getSelectedLeaves().length

  let text = cnt + " taxa"
  if (getMode() == 'taxa' && selectedCnt > 0) {
    text += ", " + selectedCnt + " selected"
  }

  printMetaInfo(text)
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

  window.api.handleGiveCurrentPrefs((event, message) => {
    window.api.takeCurrentPrefs(taxus.preferences || {})
  })

  window.api.handleTakeNewPrefs((event, prefs) => {
    if (taxus.preferences)
      taxus.applyNewPreferences(prefs)
    window.api.newPrefsTaken()
  })

  // Color picker logic

  let picker = new ColorPicker('#branch-color-picker', '#change-branch-color-action', ['#change-branch-color-box'])
  picker.add_color_change_callback(function (color) {
    let mode = modeSelector.active_button.data('mode')
    let attribute = mode === 'branch' ? "parsed_annotation" : "parsed_taxablock_annotation"

    taxus.setSelectedNodesAnnotation({ "!color": color }, attribute)
  })

  // Search panel logic

  search_panel = new SearchPanel($('#search-panel'), taxus, fasta_pane)

  // Annotation logic

  window.api.handleApplyNewAnnotation((event, data) => {
    console.log(data)
    let name = data.node_name
    let leave = taxus.getLeaveByName(name)

    if (leave){
      taxus.updateNodeTitle(leave, data.annotation.name)
      dispatchDocumentEvent('node_titles_changed')
      dispatchDocumentEvent('tree_topology_changed')
    }
  })

  window.api.handleCloseWindow(event => {
    if (taxus.hasDirtyFiles()) {
      showUnsavedFileAlert(() => {
        window.api.closeWindow()
      })
    } else {
      window.api.closeWindow()
    }
  })

  // OS Open With -> Taxus
  window.api.handleOpenFile((event, file_path) => {
    if (file_path) {
      progressBar.show()
      taxus.loadTreeFile(file_path,
        {
          success: () => {
            progressBar.setNewComplexity(taxus.getNodes().length)
          },
          after: () => {
            progressBar.hide()
          }
        }
      )
    }
  })

  window.api.windowIsReady()

  // Copy selected fasta
  document.addEventListener('copy', function (e) {
    if (e.target.tagName == 'BODY') {
      if (!taxus.treeIsLoaded()) {
        return
      }

      let fasta = taxus.getSelectedLeavesFasta()
      if (fasta) { window.api.copyText(fasta) }

      e.preventDefault()
    }
  })

  // Color picker and branch selection
  document.addEventListener('selection_modified', function (e) {
    let selection = taxus.getSelection()
    let mode = modeSelector.active_button.data('mode')
    let annotation_attribute = undefined

    if (mode == 'branch') {
      annotation_attribute = "parsed_annotation"
    } else if (mode == 'taxa') {
      annotation_attribute = "parsed_taxablock_annotation"
    }

    if (selection.length === 1) {
      let color = selection[0][annotation_attribute]['!color']

      if (color) {
        picker.set_color(color)
      } else {
        picker.remove_color()
      }
    } else if (selection.length > 1) {
      let set = new Set(selection.map((e) => { return e[annotation_attribute]['!color'] }))
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

  // Footer text

  document.addEventListener('new_tree_is_loaded', () => {
    $("#footer-text").show()
    printTaxaCount()
  })

  document.addEventListener('selection_modified', function (e) {
    printTaxaCount()
  })

  // Header update logic

  document.addEventListener('taxus_tree_header_update', (e) => {
    setWindowHeader(taxus.treeTitle())
  })

  // Windows/Linux tweaks

  if (window.api.currentPlatform() !== 'darwin') {
    $('#window-header').hide()
  }
})
