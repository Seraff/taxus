const fs = require('fs')
const Node = require('./node.js')
const FastaRepresentation = require('./fasta_representation.js')
const Preferences = require('./preferences.js')
const FastaMapping = require('./fasta_mapping.js')
const apply_extensions = require('./phylotree-ext.js')

function Fangorn () {
  var fangorn = this

  fangorn.tree_path = null

  fangorn.tree_is_dirty = false
  fangorn.fasta_is_dirty = false

  fangorn.fasta_path = null
  fangorn.fastaMapping = null

  fangorn.preferences = null

  var _nodes = []
  var _branches = null
  var _tree = null

  fangorn.get_tree = function () {
    return _tree
  }

  fangorn.tree_is_loaded = function () {
    return _tree != null
  }

  fangorn.get_nodes = function () {
    return _nodes
  }

  fangorn.get_leaves = function () {
    return _nodes.filter(function (node) { return node.is_leaf() })
  }

  fangorn.get_leave_names = function () {
    return fangorn.get_leaves().map(function (node) { return node.name })
  }

  fangorn.nodes_are_loaded = function () {
    return _nodes.length > 0
  }

  fangorn.get_selection = function () {
    return fangorn.get_tree().get_selection()
  }

  fangorn.get_selected_leaves = function () {
    return fangorn.get_selection().filter(function (node) { return node.is_leaf() })
  }

  fangorn.get_selected_internals = function () {
    return fangorn.get_selection().filter(function (node) { return node.is_internal() })
  }

  fangorn.get_marked_leaves = function () {
    return fangorn.get_leaves().filter(function (node) { return node.is_marked() })
  }

  fangorn.get_marked_leaves = function () {
    return fangorn.get_leaves().filter(function (node) { return node.is_marked() })
  }

  fangorn.get_marked_leaf_names = function () {
    return fangorn.get_leaves().filter(function (node) { return node.is_marked() }).map(function (node) { return node.name })
  }

  fangorn.is_one_leaf_selected = function () {
    return fangorn.get_selected_leaves().length === 1
  }

  // by design zero or only one internal can be selected
  fangorn.is_one_internal_selected = function () {
    return fangorn.get_selected_internals().length === 1
  }

  fangorn.is_any_interlal_selected = function () {
    return fangorn.get_selected_internals().length > 0
  }

  fangorn.is_one_selected = function () {
    return fangorn.is_one_internal_selected() || fangorn.is_one_leaf_selected()
  }

  fangorn.select_none = function () {
    fangorn.get_tree().modify_selection(function (n) { return false })
  }

  fangorn.select_all_leaves = function () {
    var all = fangorn.get_leaves()
    fangorn.get_tree().modify_selection(function (n) { return all.includes(n.target) })
  }

  fangorn.select_all = function () {
    fangorn.get_tree().modify_selection(function (n) { return _nodes.includes(n.target) })
  }

  fangorn.select_specific = function (nodes) {
    fangorn.get_tree().modify_selection(function (n) { return nodes.includes(n.target) })
  }

  fangorn.select_descendants_of_selected = function () {
    var nodes = fangorn.get_selection()

    to_select = nodes

    nodes.forEach((node) => {
      var descs = fangorn.get_tree().select_all_descendants(node, true, true)
      to_select = to_select.concat(descs)
    })

    fangorn.get_tree().modify_selection(function (n) { return to_select.includes(n.target) })
  }

  fangorn.init_phylotree = function (str) {
    _tree = d3.layout
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
      var coloring_scheme = d3.scale.category20c()
      dom_element.style(coloring_scheme(edge_object.target.cluster))
    }

    function nodeStyler (dom_element, node_object) {
      if (node_object.style) {
        node_object.style(dom_element)
      }
    }
    apply_extensions(_tree)
    _tree.node_circle_size(0)
    _tree.style_edges(edgeStyler)
    _tree.style_nodes(nodeStyler)

    try {
      _tree.read_tree(str)
    } catch (err) {
      _tree.unbindFangornEvents()
      _tree = null

      console.error(err)
      show_alert('Error', 'Unable to open tree: ' + err.message)
      return false
    }

    _tree.layout() // renders the tree

    d3.select('.phylotree-container').attr('align', 'center')

    function onSelectionModified(){
      fangorn.dispatch_state_update()
    }

    if (!document.fangorn_selection_modified_event_set) {
      document.addEventListener('selection_modified', onSelectionModified)
    }
    document.fangorn_selection_modified_event_set = true

    fangorn.fastaMapping = null
    fangorn.dispatch_state_update()

    return true
  }

  fangorn.load_tree_file = function (path) {
    try {
      // var t0 = performance.now()

      var content = fs.readFileSync(path, 'utf8')
      fangorn.load_tree_string(content)
      fangorn.tree_path = path

      fangorn.make_tree_clean()
      fangorn.make_fasta_clean()

      // var t1 = performance.now()
      // console.log("It took " + ((t1 - t0)/1000).toFixed(2) + " seconds.")

    } catch (err) {
      console.error(err)
    }
  }

  fangorn.load_tree_string = function (content) {
    fangorn.close_fasta()

    if (fangorn.init_phylotree(content)) {
      fangorn.preferences = new Preferences()
      fangorn.reinit_nodes()

      fangorn.apply_metadata_from_nexus()
      fangorn.apply_taxa_colors_from_figtree()
      fangorn.redraw_features()

      fangorn.get_tree().update() // for initial node styling.
      dispatchDocumentEvent('new_tree_is_loaded')
    }
  }

  fangorn.save_tree = function (path = null) {
    if (!fangorn.tree_is_loaded()) { return false }

    if (!path) { path = fangorn.tree_path }

    if (fangorn.get_tree().is_nexus()) {
      fangorn.get_tree().apply_fangorn_metadata(fangorn.metadata_from_current_state())
    }

    var data = fangorn.get_tree().output_tree()
    fs.writeFileSync(path, data, 'utf8')

    fangorn.make_tree_clean()
  }

  fangorn.save_fasta = function (path = null, success_callback = null) {
    if (!fangorn.fasta_is_loaded()) { return false }

    if (!path) { path = fangorn.fasta_out_path() }

    var content = fangorn.output_fasta()

    fs.writeFile(path, content, function (err) {
      if (err) {
        return console.error(err)
      } else {
        if (success_callback) { success_callback() }
      }
    })
  }

  fangorn.load_fasta_file = function (path, quiet = false) {
    fangorn.close_fasta()

    var fasta_rep = new FastaRepresentation()
    fasta_rep.read_from_file(path)

    if (fangorn.apply_fasta(fasta_rep, quiet)) {
      fangorn.fasta_path = path
      dispatchDocumentEvent('new_fasta_applied')
    }

    fangorn.make_fasta_clean()
    fangorn.redraw_features()
  }

  fangorn.fasta_out_path = function () {
    if (fangorn.fasta_is_loaded()) {
      var path = fangorn.fasta_path
      return path_is_fangorized(path) ? path : fangorize_path(path)
    }
  }

  fangorn.apply_fasta = function (fasta_rep, quiet = false) {
    var fastaMapping = new FastaMapping(fangorn.get_leaves(), fasta_rep.getSeqs())

    var nodes_without_fasta = fastaMapping.nodesWithoutFasta()
    // debugger
    if (nodes_without_fasta.length > 0) {
      var nodes_with_own_fasta = _.select(nodes_without_fasta, (n) => { return n.fasta() !== null })

      // all the nodes has it's own fasta
      if (nodes_with_own_fasta.length === nodes_without_fasta.length) {
        // ok, take fasta from nodes
        if (!quiet){
          show_alert('Warning', 'Sequences for restoring removed taxa will be taken from Nexus file')
        }
      } else {
        // incostistency, cannot load the file
        var rows = []

        rows.push('')
        rows.push('Not found in fasta file:')
        nodes_without_fasta.forEach((node) => {
          rows.push(node.name)
        })
        show_log_alert('File cannot be loaded', "The data doesn't match:", rows)

        return false
      }
    }

    fangorn.fastaMapping = fastaMapping

    fangorn.dispatch_state_update()
    fangorn.get_tree().refresh()
    return true
  }

  fangorn.output_fasta = function () {
    var content = ''

    fangorn.fastaMapping.eachMapping((m) => {
      // only fasta from entries where node is not marked or doesn't exist
      if (m.node !== null && m.node.is_marked()) {
        return
      }
      var fasta = m.fasta || m.node.fasta()
      content += fasta.to_fasta()
    })

    return content
  }

  fangorn.close_fasta = function () {
    fangorn.fastaMapping = null
    dispatchDocumentEvent('fasta_closed')
  }

  // wrap phylotree nodes with fangorn nodes
  // prepare branches
  fangorn.reinit_nodes = function () {
    if (tree_is_loaded) {
      _nodes = _tree.get_nodes().map(function (node) { return Node(fangorn, node) })

      _branches = []
      this.get_tree().get_svg().selectAll('.branch').each(function (b) { _branches.push(b) })

      _branches.forEach(function (b) {
        b.target.prev_branch = b
        b.get_element = function () { return d3.select("path[d='" + b.existing_path + "']") }
      })
    }
  }

  fangorn.fasta_is_loaded = function () {
    return fangorn.fastaMapping != null
  }

  fangorn.get_selected_leaves_fasta = function () {
    var selected = fangorn.get_selected_leaves()
    var result = ""

    selected.forEach((e) => {
      if (e.raw_fasta_entry()) {
        result += e.raw_fasta_entry()
      }
    })

    return(result == "" ? null : result)
  }

  fangorn.dispatch_state_update = function () {
    dispatchDocumentEvent('fangorn_state_update')
  }

  fangorn.each_leaf = function (f) {
    fangorn.get_leaves().forEach(function (leaf) {
      f(leaf)
    })
  }

  fangorn.update_node_title = function (node, title) {
    if (!fangorn.fasta_is_loaded()) { return null }

    var new_id = FastaRepresentation.extract_id(title)
    var fasta = node.fasta()

    node.name = new_id
    fasta.id = new_id
    fasta.header = title

    fangorn.fastaMapping.buildIndex()

    fangorn.get_tree().safe_update()

    fangorn.make_tree_dirty()
    fangorn.make_fasta_dirty()

    fangorn.redraw_features()
  }

  fangorn.reroot_to_selected_node = function () {
    if (!fangorn.is_one_selected()) {
      return false
    }
    var selection = fangorn.get_selection()
    var node = selection[0]

    fangorn.get_tree().reroot(node)
    fangorn.get_tree().safe_update()
    fangorn.make_tree_dirty()
    fangorn.reinit_nodes()
    dispatchDocumentEvent('tree_topology_changed')
  }

  fangorn.rotate_selected_branch = function () {
    if (!fangorn.is_one_internal_selected()) {
      return false
    }

    var selection = fangorn.get_selection()
    var node = selection[0]

    fangorn.get_tree().rotate_branch(node)
    fangorn.reinit_nodes()

    fangorn.make_tree_dirty()
    dispatchDocumentEvent('tree_topology_changed')
  }

  fangorn.set_selected_nodes_annotation = function (annotation) {
    fangorn.get_selection().forEach(function (node) {
      Object.keys(annotation).forEach(function (key) {
        var value = annotation[key]
        if (value){
          node.parsed_annotation[key] = annotation[key]
        } else if (node.parsed_annotation[key]) {
          delete node.parsed_annotation[key]
        }
      })
    })

    fangorn.make_tree_dirty()
  }

  // Nexus metdata stuff

  fangorn.metadata_from_nexus = function () {
    return fangorn.get_tree().nexus_to_fangorn_metadata()
  }

  // Make metadata from current tree

  fangorn.metadata_from_current_state = function () {
    var result = {}

    if (!fangorn.get_tree().is_nexus()) { return result }

    var our_removed_seqs = fangorn.get_marked_leaves().map(function (e) { return e.fasta() })

    if (our_removed_seqs.length > 0) {
      result.removed_seqs = our_removed_seqs.map(function (e) { return e.to_fasta() }).join('')
    }

    // Apply preferences

    Object.assign(result, fangorn.preferences.forNexus())

    return result
  }

  // Extract metadata from nexus and apply to current tree
  fangorn.apply_metadata_from_nexus = function () {
    var metadata = fangorn.metadata_from_nexus()

    if (!metadata) { return false }

    if (hasOwnProperty(metadata, 'removed_seqs')) {
      var removed_fasta_rep = new FastaRepresentation()

      removed_fasta_rep.read_from_str(metadata.removed_seqs)
      fangorn.get_marked_leaves().forEach(function (leaf) {
        leaf.apply_own_fasta(removed_fasta_rep.sequences[leaf.name])
      })
    }
    fangorn.preferences.applyToDefaults(metadata)
  }

  // Workaround for FigTree files: get colors of taxa from taxa block
  fangorn.apply_taxa_colors_from_figtree = function () {
    var figtree_data = fangorn.get_tree().taxlabels_data()

    if (Object.keys(figtree_data).length === 0)
      return true

    fangorn.get_leaves().forEach(function(leave){
      var data = figtree_data[leave.name]
      if (data !== undefined && data.constructor === Object)
        leave.add_annotation(data)
    })
  }

  // Dirty tree/fasta functionality

  fangorn.make_tree_dirty = function () {
    fangorn.tree_is_dirty = true
    dispatchDocumentEvent('fangorn_tree_header_update')
  }

  fangorn.make_tree_clean = function () {
    fangorn.tree_is_dirty = false
    dispatchDocumentEvent('fangorn_tree_header_update')
  }

  fangorn.make_fasta_dirty = function () {
    fangorn.fasta_is_dirty = true
    dispatchDocumentEvent('fasta_clean_status_changed')
  }

  fangorn.make_fasta_clean = function () {
    fangorn.fasta_is_dirty = false
    dispatchDocumentEvent('fasta_clean_status_changed')
  }

  fangorn.has_dirty_files = function () {
    return (fangorn.tree_is_dirty || fangorn.fasta_is_dirty)
  }

  fangorn.tree_title = function () {
    var title = fangorn.tree_path.replace(/^.*[\\\/]/, '')
    if (fangorn.tree_is_dirty) { title += "*" }

    return title
  }

  // Preferences

  fangorn.apply_new_preferences = function (prefs) {
    fangorn.preferences.applyToCurrent(prefs)
    fangorn.make_tree_dirty()
  }

  // Features

  fangorn.redraw_features = function (argument) {
    fangorn.get_leaves().forEach((n) => { n.redraw_features() })
  }

  // Cladogram mode

  fangorn.isCladogramView = function () {
    return fangorn.get_tree().cladogram
  }

  fangorn.setCladogramView = function (is_cladogram) {
    if (typeof(is_cladogram) !== 'boolean') {
      return false
    }

    fangorn.get_tree().setCladogramView(is_cladogram)
    fangorn.get_tree().safe_update()
    fangorn.reinit_nodes()
    dispatchDocumentEvent('tree_topology_changed')
  }

  fangorn.toggleCladogramView = function () {
    var new_mode = fangorn.get_tree().cladogram ? false : true
    fangorn.setCladogramView(new_mode)
  }

  return this
}

module.exports = Fangorn
