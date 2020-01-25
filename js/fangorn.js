const fs = require('fs')
const Node = require('./node.js')
const FastaPane = require('./fasta_pane.js')
const FastaRepresentation = require('./fasta_representation.js')
const Preferences = require('./preferences.js')
const apply_extensions = require('./phylotree-ext.js')

function Fangorn () {
  var fangorn = this

  fangorn.tree_path = null
  fangorn.fasta_path = null

  fangorn.fasta = null
  fangorn.fasta_pane = new FastaPane()

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

  fangorn.init_phylotree = function (str) {
    _tree = d3.layout
      .phylotree()
      .svg(d3.select('#tree_display'))
      .options({
        'context-menu-event': false,
        zoom: true,
        'show-scale': false,
        brush: false,
        collapsible: false,
        selectable: true,
        'align-tips': false,
        transitions: false,
        'internal-names': true
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
      _tree.read_tree(str).layout() // renders the tree
    } catch (err) {
      show_alert('Error', 'Unable to open tree')
    }

    d3.select('.phylotree-container').attr('align', 'center')

    document.addEventListener('selection_modified', function (e) {
      fangorn.dispatch_state_update()
    })

    fangorn.fasta = null
    fangorn.dispatch_state_update()
  }

  fangorn.load_tree_file = function (path) {
    try {
      var content = fs.readFileSync(path, 'utf8')
      fangorn.load_tree_string(content)
      fangorn.tree_path = path
    } catch (err) {
      console.error(err)
    }
  }

  fangorn.load_tree_string = function (content) {
    fangorn.close_fasta()
    fangorn.init_phylotree(content)
    fangorn.preferences = new Preferences()
    fangorn.reinit_nodes()
    fangorn.get_tree().update() // for initial node styling.
    fangorn.apply_metadata_from_nexus()
  }

  fangorn.save_tree = function (path = null) {
    if (!fangorn.tree_is_loaded()) { return false }

    if (!path) { path = fangorn.tree_path }

    if (fangorn.get_tree().is_nexus()) { fangorn.get_tree().apply_fangorn_metadata(fangorn.metadata_from_current_state()) }

    var data = fangorn.get_tree().output_tree()
    fs.writeFileSync(path, data, 'utf8')
  }

  fangorn.save_fasta = function (path = null, success_callback = null) {
    if (!fangorn.fasta_is_loaded()) { return false }

    if (!path) { path = fangorn.fasta.out_path }

    var content = fangorn.output_fasta()

    fs.writeFile(path, content, function (err) {
      if (err) {
        return console.error(err)
      } else
      if (success_callback) { success_callback() }
    })
  }

  fangorn.load_fasta_file = function (path) {
    var fasta_rep = new FastaRepresentation()

    fasta_rep.read_from_file(path)
    fangorn.apply_fasta(fasta_rep)
  }

  fangorn.load_fasta_string = function (str) {
    var fasta_rep = new FastaRepresentation()

    fasta_rep.read_from_str(str, function () {
      fangorn.apply_fasta(fasta_rep)
    })
  }

  fangorn.apply_fasta = function (fasta_rep) {
    var leave_ids = fangorn.get_leaves().map(function (node) { return node.name })
    var consistency = fasta_rep.check_consistency(leave_ids)

    // check if not_in_fasta contains seqs which are marked in the tree
    var fasta_without_marked_nodes = false

    if (consistency != true) {
      if (consistency.not_in_fasta.length > 0 && consistency.not_in_tree.length === 0) {
        var marked_ids = fangorn.get_marked_leaf_names()

        if (marked_ids.sort().join(',') === consistency.not_in_fasta.sort().join(',')) { fasta_without_marked_nodes = true }
      }
    }

    if (consistency != true && !fasta_without_marked_nodes) {
      fangorn.fasta = null
      var rows = []

      if (consistency.not_in_fasta.length > 0) {
        rows.push('')
        rows.push('Not found in fasta file:')
        rows = rows.concat(consistency.not_in_fasta)
      }

      if (consistency.not_in_tree.length > 0) {
        rows.push('')
        rows.push('Not found in the tree:')
        rows = rows.concat(consistency.not_in_tree)
      }

      show_log_alert('File cannot be loaded', "The data doesn't match:", rows)
    } else {
      fangorn.fasta = fasta_rep

      // Apply fasta records from fasta file
      fangorn.get_leaves().forEach(function (leaf) {
        if (hasOwnProperty(fasta_rep.sequences, leaf.name)) { leaf.apply_fasta(fasta_rep.sequences[leaf.name]) }
      })

      // Apply fasta records for marked leaves from metadata
      if (fasta_without_marked_nodes) {
        show_alert('Warning', 'Sequences for restoring removed taxa will be taken from Nexus file')
      }

      fangorn.redraw_fasta_sidebar()
      fangorn.dispatch_state_update()
      fangorn.get_tree().refresh()
    }
  }

  fangorn.output_fasta = function () {
    var content = ''

    fangorn.each_leaf(function (leaf) {
      var raw_fasta = leaf.raw_fasta_entry()
      if (raw_fasta != null) { content += raw_fasta }
    })

    return content
  }

  fangorn.close_fasta = function () {
    fangorn.fasta = null
    fangorn.fasta_pane.show_no_fasta()
  }

  // wrap phylotree nodes with fangorn nodes
  // prepare branches
  fangorn.reinit_nodes = function () {
    if (tree_is_loaded) {
      _nodes = _tree.get_nodes().map(function (node) { return Node(fangorn, node) })

      _branches = []
      this.get_tree().get_svg().selectAll('.branch').each(function (b) { _branches.push(b) })
      _branches.forEach(function (b) {
        b.source.next_branch = b
        b.target.prev_branch = b
        b.get_element = function () { return d3.select("path[d='" + b.existing_path + "']") }
      })
    }
  }

  fangorn.fasta_is_loaded = function () {
    return fangorn.fasta != null
  }

  fangorn.redraw_fasta_sidebar = function () {
    fangorn.fasta_pane.set_title_from_path(fangorn.fasta.path)
    fangorn.fasta_pane.draw_fasta(fangorn.get_leaves())
  }

  fangorn.dispatch_state_update = function () {
    var event = new Event('fangorn_state_update')
    document.dispatchEvent(event)
  }

  fangorn.each_leaf = function (f) {
    fangorn.get_leaves().forEach(function (leaf) {
      f(leaf)
    })
  }

  fangorn.update_node_title = function (node, title) {
    if (!fangorn.fasta_is_loaded()) { return null }

    var new_id = FastaRepresentation.extract_id(title)
    node.name = new_id
    node.fasta.id = new_id
    node.fasta.title = title

    fangorn.redraw_fasta_sidebar()
  }

  fangorn.reroot_to_selected_node = function () {
    var selection = fangorn.get_selection()

    if (selection.length === 1) {
      var node = selection[0]
      fangorn.get_tree().reroot(node)
    }

    fangorn.get_tree().safe_update()
    fangorn.reinit_nodes()
  }

  fangorn.set_selected_nodes_annotation = function (annotation) {
    fangorn.get_selection().forEach(function (node) {
      Object.keys(annotation).forEach(function (key) {
        node.parsed_annotation[key] = annotation[key]
      })
    })
  }

  // Nexus metdata stuff

  fangorn.metadata_from_nexus = function () {
    return fangorn.get_tree().nexus_to_fangorn_metadata()
  }

  // Make metadata from current tree

  fangorn.metadata_from_current_state = function () {
    var result = {}

    if (!fangorn.get_tree().is_nexus()) { return result }

    var our_removed_seqs = fangorn.get_marked_leaves().map(function (e) { return e.fasta })

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
        leaf.apply_fasta(removed_fasta_rep.sequences[leaf.name])
      })
    }
    fangorn.preferences.applyToDefaults(metadata)
  }

  return this
}

module.exports = Fangorn
