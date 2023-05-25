class Taxus {
  static TREE_EXT = ['tre', 'tree', 'nexus', 'nex', 'nxs',
                     'newick', 'txt', 'treefile', 'contree']
  static FASTA_EXT = ['fa', 'fas', 'fasta', 'fna', 'faa', 'ffn', 'frn']

  constructor(){
    this.tree_path = null

    this.tree_is_dirty = false
    this.fasta_is_dirty = false

    this.fasta_path = null
    this.fastaMapping = null

    this.preferences = null

    this._nodes = []
    this._branches = null
    this._tree = null
  }

  getTree() {
    return this._tree
  }

  treeIsLoaded() {
    return this._tree != null
  }

  getNodes() {
    return this._nodes
  }

  getLeaves() {
    return this._nodes.filter(function (node) { return node.isLeaf() })
  }

  getLeaveByName(name) {
    return this.getLeaves().find((leave) => { return leave.name == name })
  }

  getLeaveNames() {
    return this.getLeaves().map(function (node) { return node.name })
  }

  nodesAreLoaded() {
    return this._nodes.length > 0
  }

  getSelection() {
    return this.getTree().get_selection()
  }

  getSelectedLeaves() {
    return this.getSelection().filter(function (node) { return node.isLeaf() })
  }

  getSelectedInternals() {
    return this.getSelection().filter(function (node) { return node.isInternal() })
  }

  getMarkedLeaves() {
    return this.getLeaves().filter(function (node) { return node.isMarked() })
  }

  getMarkedLeaves() {
    return this.getLeaves().filter(function (node) { return node.isMarked() })
  }

  getMarkedLeafNames() {
    return this.getLeaves().filter(function (node) { return node.isMarked() }).map(function (node) { return node.name })
  }

  isOneLeafSelected() {
    return this.getSelectedLeaves().length === 1
  }

  // by design zero or only one internal can be selected
  isOneInternalSelected() {
    return this.getSelectedInternals().length === 1
  }

  isAnyInterlalSelected() {
    return this.getSelectedInternals().length > 0
  }

  isOneSelected() {
    return this.isOneInternalSelected() || this.isOneLeafSelected()
  }

  selectNone() {
    this.getTree().modify_selection(function (n) { return false })
  }

  selectAllLeaves() {
    let all = this.getLeaves()
    this.getTree().modify_selection(function (n) { return all.includes(n.target) })
  }

  selectAll() {
    this.getTree().modify_selection(function (n) { return this._nodes.includes(n.target) })
  }

  selectSpecific(nodes) {
    this.getTree().modify_selection(function (n) { return nodes.includes(n.target) })
  }

  selectDescendants() {
    let nodes = this.getSelection()
    let to_select = nodes

    nodes.forEach((node) => {
      let descs = this.getTree().select_all_descendants(node, true, true)
      to_select = to_select.concat(descs)
    })

    this.getTree().modify_selection(function (n) { return to_select.includes(n.target) })
  }

  initPhylotree(nexus) {
    this._tree = d3.layout
      .phylotree()
      .svg(d3.select('#tree_display'))
      .options({
        'context-menu-event': false,
        zoom: true,
        brush: false,
        collapsible: false,
        selectable: true,
        'align-tips': false,
        transitions: false,
        'internal-names': true,
        'show-scale': false
      })

    function edgeStyler (dom_element, edge_object) {
      let coloring_scheme = d3.scale.category20c()
      dom_element.style(coloring_scheme(edge_object.target.cluster))
    }

    function nodeStyler (dom_element, node_object) {
      if (node_object.style) {
        node_object.style(dom_element)
      }
    }

    applyPhylotreeExtensions(this._tree)
    this._tree.node_circle_size(0)
    this._tree.style_edges(edgeStyler)
    this._tree.style_nodes(nodeStyler)

    try {
      let nwkStr = nexus.treesblock.trees[0].newick
      let nwk = d3.layout.newick_parser(nwkStr)
      this._tree(nwk)
      this.nexus = nexus
    } catch (err) {
      this._tree.unbindTaxusEvents()
      this._tree = null

      console.error(err)
      showSimpleError('Error', 'Unable to open tree: ' + err.message)
      return false
    }

    this._tree.layout() // renders the tree

    d3.select('.phylotree-container').attr('align', 'center')

    let onSelectionModified = () => {
      this.dispatchStateUpdate()
    }

    if (!document.taxus_selection_modified_event_set) {
      document.addEventListener('selection_modified', onSelectionModified)
    }
    document.taxus_selection_modified_event_set = true

    this.fastaMapping = null

    // extract additional annotation from taxablock
    if (nexus.taxablock !== undefined) {
      let leaves = {}
      this._tree.get_nodes().forEach((n) => {
        if (n.name !== '' && n.name !== 'root'){
          leaves[n.name] = n
        }
      })

      let labels = nexus.taxablock.taxlabels
      labels.forEach((l) => {
        let match = l.match(/^(?<name>.+?)\s*(?<annotation>\[.+\])?$/)
        if (match !== null) {
          if (match.groups.name in leaves && match.groups.annotation !== undefined) {
            let annotation = match.groups.annotation.replace('[', '').replace(']', '')
            leaves[match.groups.name].taxablock_annotation = annotation
          }
        }
      })
    }

    this.dispatchStateUpdate()

    return true
  }

  loadTreeFile(path, callbacks) {
    window.api.loadFile(path).then( content => {
      try {
        this.loadTreeString(content)
        this.tree_path = path

        this.makeTreeClean()
        this.makeFastaClean()

        if (callbacks.success)
          callbacks.success()

      } catch (e) {
        showSimpleError(e)
      }
    }, error => {
      console.error(error)
    }).finally(() => {
      if (callbacks.after)
        callbacks.after()
    })
  }

  loadTreeString(content) {
    this.closeFasta()

    let nexus = null

    if (content.startsWith('#NEXUS')) {
      nexus = parseNexus(content)
    } else if (content[0] == '(') {
      nexus = nexusFromNewick(content)
    } else {
      throw "Wrong Input File Format";
    }

    if (this.initPhylotree(nexus)) {
      this.preferences = new Preferences()
      this.reinitNodes()

      this.applyMetadataFromNexus()
      this.redrawFeatures()

      this.getTree().update() // for initial node styling.
      dispatchDocumentEvent('new_tree_is_loaded')
    }
  }

  saveTree(path = null) {
    if (!this.treeIsLoaded())
      return false

    if (!path)
      path = this.tree_path

    let nexus = taxusToNexus(this)
    let data = nexusToString(nexus)

    window.api.saveFile(path, data).then(() => {
      this.makeTreeClean()
    }, error => {
      console.error(error)
    })
  }

  saveFasta(path = null, success_callback = null) {
    if (!this.fastaIsLoaded()) { return false }

    if (!path) { path = this.fastaOutPath() }

    let content = this.outputFasta()

    window.api.saveFile(path, content).then(() => {
      if (success_callback)
        success_callback()
    }, error => {
      console.error(error)
    })
  }

  loadFastaFile(path, quiet = false) {
    this.closeFasta()

    let fasta_rep = new FastaRepresentation()

    fasta_rep.readFromFile(path, () => {
      if (this.applyFasta(fasta_rep, quiet)) {
        this.fasta_path = path
        dispatchDocumentEvent('new_fasta_applied')
      }

      this.makeFastaClean()
      this.redrawFeatures()
    })
  }

  fastaOutPath() {
    if (this.fastaIsLoaded()) {
      let path = this.fasta_path
      return pathIsTaxusized(path) ? path : taxusizePath(path)
    }
  }

  applyFasta(fasta_rep, quiet = false) {
    let fastaMapping = new FastaMapping(this.getLeaves(), fasta_rep.getSeqs())

    let nodes_without_fasta = fastaMapping.nodesWithoutFasta()

    if (nodes_without_fasta.length > 0) {
      let nodes_with_own_fasta = _.select(nodes_without_fasta, (n) => { return n.fasta() !== null })

      // all the nodes has it's own fasta
      if (nodes_with_own_fasta.length === nodes_without_fasta.length) {
        // ok, take fasta from nodes
        if (!quiet){
          showSimpleWarning('Warning', 'Sequences for restoring removed taxa will be taken from Nexus file')
        }
      } else {
        // incostistency, cannot load the file
        let rows = []
        rows.push('')
        rows.push('Not found in fasta file:')
        nodes_without_fasta.forEach((node) => {
          rows.push(node.name)
        })
        showSimpleError('File cannot be loaded', "The data doesn't match:\n" + rows.join('\n'))

        return false
      }
    }

    this.fastaMapping = fastaMapping

    this.dispatchStateUpdate()
    this.getTree().refresh()
    return true
  }

  outputFasta() {
    let content = ''

    this.fastaMapping.eachMapping((m) => {
      // only fasta from entries where node is not marked or doesn't exist
      if (m.node !== null && m.node.isMarked()) {
        return
      }
      let fasta = m.fasta || m.node.fasta()
      content += fasta.toFasta()
    })

    return content
  }

  closeFasta() {
    this.fastaMapping = null
    dispatchDocumentEvent('fasta_closed')
  }

  // wrap phylotree nodes with taxus nodes
  // prepare branches
  reinitNodes() {
    if (this.treeIsLoaded()) {
      this._nodes = this._tree.get_nodes().map((node) => {
        return Node(this, node)
      })

      this._branches = []
      this.getTree().get_svg().selectAll('.branch').each((b) => { this._branches.push(b) })

      this._branches.forEach((b) => {
        b.target.prev_branch = b
        b.get_element = () => { return d3.select("path[d='" + b.existing_path + "']") }
      })
    }
  }

  fastaIsLoaded() {
    return this.fastaMapping != null
  }

  getSelectedLeavesFasta() {
    let selected = this.getSelectedLeaves()
    let result = ""

    selected.forEach((e) => {
      if (e.rawFastaEntry()) {
        result += e.rawFastaEntry()
      }
    })

    return(result == "" ? null : result)
  }

  dispatchStateUpdate() {
    dispatchDocumentEvent('taxus_state_update')
  }

  eachLeaf(f) {
    this.getLeaves().forEach(function (leaf) {
      f(leaf)
    })
  }

  updateNodeTitle(node, title) {
    if (!this.fastaIsLoaded()) { return null }

    let new_id = FastaRepresentation.extract_id(title)
    let fasta = node.fasta()

    node.name = new_id
    fasta.id = new_id
    fasta.header = title

    this.fastaMapping.buildIndex()

    this.getTree().safe_update()

    this.makeTreeDirty()
    this.makeFastaDirty()

    this.redrawFeatures()
  }

  rerootToSelectedNode() {
    if (!this.isOneSelected()) {
      return false
    }

    let selection = this.getSelection()
    let node = selection[0]

    this.getTree().reroot(node)
    this.getTree().safe_update()
    this.makeTreeDirty()
    this.reinitNodes()
    dispatchDocumentEvent('tree_topology_changed')
  }

  rotateSelectedBranch() {
    if (!this.isOneInternalSelected()) {
      return false
    }

    let selection = this.getSelection()
    let node = selection[0]

    this.getTree().rotate_branch(node)
    this.reinitNodes()

    this.makeTreeDirty()
    dispatchDocumentEvent('tree_topology_changed')
  }

  setSelectedNodesAnnotation(annotation, annotation_attribute = 'parsed_annotation') {
    this.getSelection().forEach(function (node) {
      Object.keys(annotation).forEach(function (key) {
        let value = annotation[key]

        if (value){
          node[annotation_attribute][key] = annotation[key]
        } else if (node[annotation_attribute][key]) {
          delete node[annotation_attribute][key]
        }
      })
    })

    this.makeTreeDirty()
  }

  // Nexus metdata stuff

  metadataFromNexus() {
    let result = this.nexus.taxus

    if (result !== undefined && 'removed_seqs' in result) {
      let encoded = result.removed_seqs
      result['removed_seqs'] = pako.inflate(atob(encoded), { to: 'string' })
    }

    return result
  }

  // Make metadata from current tree

  metadataFromCurrentState() {
    let result = {}

    let our_removed_seqs = this.getMarkedLeaves().map(function (e) { return e.fasta() })

    if (our_removed_seqs.length > 0) {
      result.removed_seqs = our_removed_seqs.map(function (e) { return e.toFasta() }).join('')
    }

    // Apply preferences

    Object.assign(result, this.preferences.forNexus())

    return result
  }

  // Extract metadata from nexus and apply to current tree
  applyMetadataFromNexus() {
    let metadata = this.metadataFromNexus()

    if (!metadata) { return false }

    if (hasOwnProperty(metadata, 'removed_seqs')) {
      let removed_fasta_rep = new FastaRepresentation()

      removed_fasta_rep.readFromStr(metadata.removed_seqs)
      this.getMarkedLeaves().forEach(function (leaf) {
        leaf.applyOwnFasta(removed_fasta_rep.sequences[leaf.name])
      })
    }

    this.preferences.applyToDefaults(metadata)
  }

  // Dirty tree/fasta functionality

  makeTreeDirty() {
    this.tree_is_dirty = true
    dispatchDocumentEvent('taxus_tree_header_update')
  }

  makeTreeClean() {
    this.tree_is_dirty = false
    dispatchDocumentEvent('taxus_tree_header_update')
  }

  makeFastaDirty() {
    this.fasta_is_dirty = true
    dispatchDocumentEvent('fasta_clean_status_changed')
  }

  makeFastaClean() {
    this.fasta_is_dirty = false
    dispatchDocumentEvent('fasta_clean_status_changed')
  }

  hasDirtyFiles() {
    return (this.tree_is_dirty || this.fasta_is_dirty)
  }

  treeTitle() {
    let title = this.tree_path.replace(/^.*[\\\/]/, '')
    if (this.tree_is_dirty) { title += "*" }

    return title
  }

  // Preferences

  applyNewPreferences(prefs) {
    this.preferences.applyToCurrent(prefs)
    this.makeTreeDirty()
    this.getTree().safe_update()
    this.redrawFeatures()
  }

  // Features

  redrawFeatures(argument) {
    this.getLeaves().forEach((n) => { n.redraw_features() })
  }

  // Cladogram mode

  isCladogramView() {
    return this.getTree().cladogram
  }

  setCladogramView(is_cladogram) {
    if (typeof(is_cladogram) !== 'boolean') {
      return false
    }

    this.getTree().setCladogramView(is_cladogram)
    this.getTree().safe_update()
    this.reinitNodes()
    dispatchDocumentEvent('tree_topology_changed')
  }

  toggleCladogramView() {
    let new_mode = this.getTree().cladogram ? false : true
    this.setCladogramView(new_mode)
  }
}
