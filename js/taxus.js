// const Node = require('./node.js')
// const Preferences = require('./preferences.js')
// const FastaMapping = require('./fasta_mapping.js')
// const apply_extensions = require('./phylotree-ext.js')

class Taxus {
  static TREE_EXT = ['tre', 'tree', 'nexus', 'nex', 'nxs', 'newick', 'txt']
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

  get_tree() {
    return this._tree
  }

  tree_is_loaded() {
    return this._tree != null
  }

  get_nodes() {
    return this._nodes
  }

  get_leaves() {
    return this._nodes.filter(function (node) { return node.is_leaf() })
  }

  get_leave_names() {
    return this.get_leaves().map(function (node) { return node.name })
  }

  nodes_are_loaded() {
    return this._nodes.length > 0
  }

  get_selection() {
    return this.get_tree().get_selection()
  }

  get_selected_leaves() {
    return this.get_selection().filter(function (node) { return node.is_leaf() })
  }

  get_selected_internals() {
    return this.get_selection().filter(function (node) { return node.is_internal() })
  }

  get_marked_leaves() {
    return this.get_leaves().filter(function (node) { return node.is_marked() })
  }

  get_marked_leaves() {
    return this.get_leaves().filter(function (node) { return node.is_marked() })
  }

  get_marked_leaf_names() {
    return this.get_leaves().filter(function (node) { return node.is_marked() }).map(function (node) { return node.name })
  }

  is_one_leaf_selected() {
    return this.get_selected_leaves().length === 1
  }

  // by design zero or only one internal can be selected
  is_one_internal_selected() {
    return this.get_selected_internals().length === 1
  }

  is_any_interlal_selected() {
    return this.get_selected_internals().length > 0
  }

  is_one_selected() {
    return this.is_one_internal_selected() || this.is_one_leaf_selected()
  }

  select_none() {
    this.get_tree().modify_selection(function (n) { return false })
  }

  select_all_leaves() {
    let all = this.get_leaves()
    this.get_tree().modify_selection(function (n) { return all.includes(n.target) })
  }

  select_all() {
    this.get_tree().modify_selection(function (n) { return this._nodes.includes(n.target) })
  }

  select_specific(nodes) {
    this.get_tree().modify_selection(function (n) { return nodes.includes(n.target) })
  }

  selectDescendants() {
    let nodes = this.get_selection()
    let to_select = nodes

    nodes.forEach((node) => {
      let descs = this.get_tree().select_all_descendants(node, true, true)
      to_select = to_select.concat(descs)
    })

    this.get_tree().modify_selection(function (n) { return to_select.includes(n.target) })
  }

  init_phylotree(str) {
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
      this._tree.read_tree(str)
    } catch (err) {
      this._tree.unbindTaxusEvents()
      this._tree = null

      console.error(err)
      showAlert('Error', 'Unable to open tree: ' + err.message)
      return false
    }

    this._tree.layout() // renders the tree

    d3.select('.phylotree-container').attr('align', 'center')

    let onSelectionModified = () => {
      this.dispatch_state_update()
    }

    if (!document.taxus_selection_modified_event_set) {
      document.addEventListener('selection_modified', onSelectionModified)
    }
    document.taxus_selection_modified_event_set = true

    this.fastaMapping = null
    this.dispatch_state_update()

    return true
  }

  load_tree_file(path, callback=undefined) {
    window.api.loadFile(path).then( content => {
      this.load_tree_string(content)
      this.tree_path = path

      this.make_tree_clean()
      this.make_fasta_clean()

      if (callback)
        callback()

    }, error => {
      console.error(error)
    })
  }

  load_tree_string(content) {
    this.close_fasta()

    if (this.init_phylotree(content)) {
      this.preferences = new Preferences()
      this.reinit_nodes()

      this.apply_metadata_from_nexus()
      this.apply_taxa_colors_from_figtree()
      this.redraw_features()

      this.get_tree().update() // for initial node styling.
      dispatchDocumentEvent('new_tree_is_loaded')
    }
  }

  save_tree(path = null) {
    if (!this.tree_is_loaded())
      return false

    if (!path)
      path = this.tree_path

    if (this.get_tree().is_nexus())
      this.get_tree().apply_taxus_metadata(this.metadata_from_current_state())

    let data = this.get_tree().output_tree()

    window.api.saveFile(path, data).then(() => {
      this.make_tree_clean()
    }, error => {
      console.error(error)
    })
  }

  save_fasta(path = null, success_callback = null) {
    if (!this.fasta_is_loaded()) { return false }

    if (!path) { path = this.fasta_out_path() }

    let content = this.output_fasta()

    window.api.saveFile(path, content).then(() => {
      if (success_callback)
        success_callback()
    }, error => {
      console.error(error)
    })
  }

  load_fasta_file(path, quiet = false) {
    this.close_fasta()

    let fasta_rep = new FastaRepresentation()

    fasta_rep.read_from_file(path, () => {
      if (this.apply_fasta(fasta_rep, quiet)) {
        this.fasta_path = path
        dispatchDocumentEvent('new_fasta_applied')
      }

      this.make_fasta_clean()
      this.redraw_features()
    })
  }

  fasta_out_path() {
    if (this.fasta_is_loaded()) {
      let path = this.fasta_path
      return path_is_taxusized(path) ? path : taxusize_path(path)
    }
  }

  apply_fasta(fasta_rep, quiet = false) {
    let fastaMapping = new FastaMapping(this.get_leaves(), fasta_rep.getSeqs())

    let nodes_without_fasta = fastaMapping.nodesWithoutFasta()

    if (nodes_without_fasta.length > 0) {
      let nodes_with_own_fasta = _.select(nodes_without_fasta, (n) => { return n.fasta() !== null })

      // all the nodes has it's own fasta
      if (nodes_with_own_fasta.length === nodes_without_fasta.length) {
        // ok, take fasta from nodes
        if (!quiet){
          showAlert('Warning', 'Sequences for restoring removed taxa will be taken from Nexus file')
        }
      } else {
        // incostistency, cannot load the file
        let rows = []

        rows.push('')
        rows.push('Not found in fasta file:')
        nodes_without_fasta.forEach((node) => {
          rows.push(node.name)
        })
        showLogAlert('File cannot be loaded', "The data doesn't match:", rows)

        return false
      }
    }

    this.fastaMapping = fastaMapping

    this.dispatch_state_update()
    this.get_tree().refresh()
    return true
  }

  output_fasta() {
    let content = ''

    this.fastaMapping.eachMapping((m) => {
      // only fasta from entries where node is not marked or doesn't exist
      if (m.node !== null && m.node.is_marked()) {
        return
      }
      let fasta = m.fasta || m.node.fasta()
      content += fasta.to_fasta()
    })

    return content
  }

  close_fasta() {
    this.fastaMapping = null
    dispatchDocumentEvent('fasta_closed')
  }

  // wrap phylotree nodes with taxus nodes
  // prepare branches
  reinit_nodes() {
    if (this.tree_is_loaded()) {
      this._nodes = this._tree.get_nodes().map((node) => { return Node(this, node) })

      this._branches = []
      this.get_tree().get_svg().selectAll('.branch').each((b) => { this._branches.push(b) })

      this._branches.forEach((b) => {
        b.target.prev_branch = b
        b.get_element = () => { return d3.select("path[d='" + b.existing_path + "']") }
      })
    }
  }

  fasta_is_loaded() {
    return this.fastaMapping != null
  }

  get_selected_leaves_fasta() {
    let selected = this.get_selected_leaves()
    let result = ""

    selected.forEach((e) => {
      if (e.raw_fasta_entry()) {
        result += e.raw_fasta_entry()
      }
    })

    return(result == "" ? null : result)
  }

  dispatch_state_update() {
    dispatchDocumentEvent('taxus_state_update')
  }

  each_leaf(f) {
    this.get_leaves().forEach(function (leaf) {
      f(leaf)
    })
  }

  update_node_title(node, title) {
    if (!this.fasta_is_loaded()) { return null }

    let new_id = FastaRepresentation.extract_id(title)
    let fasta = node.fasta()

    node.name = new_id
    fasta.id = new_id
    fasta.header = title

    this.fastaMapping.buildIndex()

    this.get_tree().safe_update()

    this.make_tree_dirty()
    this.make_fasta_dirty()

    this.redraw_features()
  }

  rerootToSelectedNode() {
    if (!this.is_one_selected()) {
      return false
    }

    let selection = this.get_selection()
    let node = selection[0]

    this.get_tree().reroot(node)
    this.get_tree().safe_update()
    this.make_tree_dirty()
    this.reinit_nodes()
    dispatchDocumentEvent('tree_topology_changed')
  }

  rotateSelectedBranch() {
    if (!this.is_one_internal_selected()) {
      return false
    }

    let selection = this.get_selection()
    let node = selection[0]

    this.get_tree().rotate_branch(node)
    this.reinit_nodes()

    this.make_tree_dirty()
    dispatchDocumentEvent('tree_topology_changed')
  }

  set_selected_nodes_annotation(annotation) {
    this.get_selection().forEach(function (node) {
      Object.keys(annotation).forEach(function (key) {
        let value = annotation[key]
        if (value){
          node.parsed_annotation[key] = annotation[key]
        } else if (node.parsed_annotation[key]) {
          delete node.parsed_annotation[key]
        }
      })
    })

    this.make_tree_dirty()
  }

  // Nexus metdata stuff

  metadata_from_nexus() {
    return this.get_tree().nexus_to_taxus_metadata()
  }

  // Make metadata from current tree

  metadata_from_current_state() {
    let result = {}

    if (!this.get_tree().is_nexus()) { return result }

    let our_removed_seqs = this.get_marked_leaves().map(function (e) { return e.fasta() })

    if (our_removed_seqs.length > 0) {
      result.removed_seqs = our_removed_seqs.map(function (e) { return e.to_fasta() }).join('')
    }

    // Apply preferences

    Object.assign(result, this.preferences.forNexus())

    return result
  }

  // Extract metadata from nexus and apply to current tree
  apply_metadata_from_nexus() {
    let metadata = this.metadata_from_nexus()

    if (!metadata) { return false }

    if (hasOwnProperty(metadata, 'removed_seqs')) {
      let removed_fasta_rep = new FastaRepresentation()

      removed_fasta_rep.read_from_str(metadata.removed_seqs)
      this.get_marked_leaves().forEach(function (leaf) {
        leaf.apply_own_fasta(removed_fasta_rep.sequences[leaf.name])
      })
    }
    this.preferences.applyToDefaults(metadata)
  }

  // Workaround for FigTree files: get colors of taxa from taxa block
  apply_taxa_colors_from_figtree() {
    let figtree_data = this.get_tree().taxlabels_data()

    if (Object.keys(figtree_data).length === 0)
      return true

    this.get_leaves().forEach(function(leave){
      let data = figtree_data[leave.name]
      if (data !== undefined && data.constructor === Object)
        leave.add_annotation(data)
    })
  }

  // Dirty tree/fasta functionality

  make_tree_dirty() {
    this.tree_is_dirty = true
    dispatchDocumentEvent('taxus_tree_header_update')
  }

  make_tree_clean() {
    console.log('make_tree_clean')
    console.log(this)
    this.tree_is_dirty = false
    dispatchDocumentEvent('taxus_tree_header_update')
  }

  make_fasta_dirty() {
    this.fasta_is_dirty = true
    dispatchDocumentEvent('fasta_clean_status_changed')
  }

  make_fasta_clean() {
    this.fasta_is_dirty = false
    dispatchDocumentEvent('fasta_clean_status_changed')
  }

  has_dirty_files() {
    return (this.tree_is_dirty || this.fasta_is_dirty)
  }

  tree_title() {
    let title = this.tree_path.replace(/^.*[\\\/]/, '')
    if (this.tree_is_dirty) { title += "*" }

    return title
  }

  // Preferences

  apply_new_preferences(prefs) {
    this.preferences.applyToCurrent(prefs)
    this.make_tree_dirty()
  }

  // Features

  redraw_features(argument) {
    this.get_leaves().forEach((n) => { n.redraw_features() })
  }

  // Cladogram mode

  isCladogramView() {
    return this.get_tree().cladogram
  }

  setCladogramView(is_cladogram) {
    if (typeof(is_cladogram) !== 'boolean') {
      return false
    }

    this.get_tree().setCladogramView(is_cladogram)
    this.get_tree().safe_update()
    this.reinit_nodes()
    dispatchDocumentEvent('tree_topology_changed')
  }

  toggleCladogramView() {
    let new_mode = this.get_tree().cladogram ? false : true
    this.setCladogramView(new_mode)
  }
}
