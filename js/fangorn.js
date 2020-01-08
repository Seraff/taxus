const fs = require('fs')
const Node = require('./node.js')
const FastaRepresentation = require('./fasta_representation.js')
const apply_extensions = require('./phylotree-ext.js')
const pako = require('pako')

t = null

function Fangorn(){
  var fangorn = this

  fangorn.tree_path = null
  fangorn.fasta_path = null

  fangorn.fasta = null

  var _nodes = null
  var _branches = null
  var _tree = null

  fangorn.get_tree = function(){
    return _tree
  }

  fangorn.tree_is_loaded = function(){
    return _tree != null
  }

  fangorn.get_nodes = function(){
    return _nodes
  }

  fangorn.get_leaves = function(){
    return _nodes.filter(function(node){ return node.is_leaf() })
  }

  fangorn.get_leave_names = function(){
    return fangorn.get_leaves().map(function(node){ return node.name })
  }

  fangorn.nodes_are_loaded = function(){
    return _nodes.length > 0
  }

  fangorn.get_selection = function(){
    return fangorn.get_tree().get_selection()
  }

  fangorn.get_selected_leaves = function(){
    return fangorn.get_selection().filter(function(node){ return node.is_leaf() })
  }

  fangorn.get_selected_internals = function(){
    return fangorn.get_selection().filter(function(node){ return node.is_internal() })
  }

  fangorn.get_marked_leaves = function(){
    return fangorn.get_leaves().filter(function(node){ return node.is_marked() })
  }

  fangorn.get_marked_leaves = function(){
    return fangorn.get_leaves().filter(function(node){ return node.is_marked() })
  }

  fangorn.get_marked_leaf_names = function(){
    return fangorn.get_leaves().filter(function(node){ return node.is_marked() }).map(function(node){ return node.name })
  }

  fangorn.is_one_leaf_selected = function(){
    return fangorn.get_selected_leaves().length == 1
  }

  // by design zero or only one internal can be selected
  fangorn.is_one_internal_selected = function(){
    return fangorn.get_selected_internals().length == 1
  }

  fangorn.init_phylotree = function(str){
    _tree = d3.layout
               .phylotree()
               .svg(d3.select("#tree_display"))
               .options({
                "context-menu-event": false,
                zoom: true,
                "show-scale": false,
                brush: false,
                collapsible: false,
                selectable: true,
                "align-tips": false,
                transitions: false
               })


    function edgeStyler(dom_element, edge_object) {
      var coloring_scheme = d3.scale.category20c()
      dom_element.style(coloring_scheme(edge_object.target.cluster))
    }

    function nodeStyler(dom_element, node_object) {
      if (node_object.style){
        node_object.style(dom_element)
      }
    }
    apply_extensions(_tree)
    _tree.node_circle_size(0)
    _tree.style_edges(edgeStyler)
    _tree.style_nodes(nodeStyler)
    _tree.read_tree(str).layout() // renders the tree

    d3.select(".phylotree-container").attr("align", "center")

    document.addEventListener('selection_modified', function(e){
      fangorn.dispatch_state_update()
    })

    fangorn.fasta = null
    fangorn.init_fasta_sidebar()
    fangorn.dispatch_state_update()

  }

  fangorn.load_tree_file = function(path){
    try {
      var content = fs.readFileSync(path, 'utf8')
      fangorn.load_tree_string(content)
      fangorn.tree_path = path

    } catch(err) {
      console.error(err)
    }
  }

  fangorn.load_tree_string = function(content){
    fangorn.init_phylotree(content)
    fangorn.reinit_nodes()
    fangorn.get_tree().update(); // for initial node styling.
  }

  fangorn.save_tree = function(path = null){
    if (!fangorn.tree_is_loaded())
      return false

    if (!path)
      path = fangorn.tree_path


    if (fangorn.get_tree().is_nexus())
      fangorn.get_tree().apply_json_metadata(fangorn.metadata_json())

    var data = fangorn.get_tree().output_tree()
    fs.writeFileSync(path, data, 'utf8')
  }

  fangorn.save_fasta = function(path = null){
    if (!fangorn.fasta_is_loaded())
      return false

    if (!path)
      path = fangorn.fasta.out_path

    var content = fangorn.output_fasta()

    fs.writeFile(fangorn.fasta.out_path, content, function(err) {
      if(err) {
        return console.error(err)
      }
    })
  }

  fangorn.load_fasta_file = function(path){
    var fasta_rep = new FastaRepresentation()

    fasta_rep.read_from_file(path, function(){
      fangorn.apply_fasta(fasta_rep)
    })
  }

  fangorn.load_fasta_string = function(str){
    var fasta_rep = new FastaRepresentation()

    fasta_rep.read_from_str(str, function(){
      fangorn.apply_fasta(fasta_rep)
    })
  }

  fangorn.apply_fasta = function(fasta_rep){
    var leave_ids = fangorn.get_leaves().map(function(node){ return node.name })
    var consistency = fasta_rep.check_consistency(leave_ids)

    // check if not_in_fasta contains seqs which are marked in the tree
    var fasta_without_marked_nodes = false

    if (consistency != true){
      if (consistency['not_in_fasta'].length > 0 && consistency['not_in_tree'].length === 0){
        var marked_ids = fangorn.get_marked_leaf_names()

        if (marked_ids.sort().join(',') === consistency['not_in_fasta'].sort().join(','))
          fasta_without_marked_nodes = true
      }
    }

    if (consistency != true && !fasta_without_marked_nodes){
      fangorn.fasta = null
      var rows = []

      if (consistency['not_in_fasta'].length > 0){
        rows.push('')
        rows.push('Not found in fasta file:')
        rows = rows.concat(consistency['not_in_fasta'])
      }

      if (consistency['not_in_tree'].length > 0){
        rows.push('')
        rows.push('Not found in the tree:')
        rows = rows.concat(consistency['not_in_tree'])
      }

      show_log_alert("File cannot be loaded", "The data doesn't match:", rows)
    } else {
      fangorn.fasta = fasta_rep

      // Apply fasta records from fasta file
      fangorn.get_leaves().forEach(function(leaf){
        if (fasta_rep.sequences.hasOwnProperty(leaf.name))
          leaf.apply_fasta(fasta_rep.sequences[leaf.name])
      })

      // Apply fasta records for marked leaves from metadata
      if (fasta_without_marked_nodes) {
        show_alert("Warning", "Sequences for restoring removed taxa will be taken from Nexus file")

        var removed_fasta_rep = new FastaRepresentation()
        removed_fasta_rep.read_from_str(fangorn.get_removed_fasta_metadata(), function(seqs){
          fangorn.get_marked_leaves().forEach(function(leaf){
            leaf.apply_fasta(seqs[leaf.name])
          })
        })
      }

      fangorn.init_fasta_sidebar()
      fangorn.dispatch_state_update()
      fangorn.get_tree().refresh()
    }
  }

  fangorn.output_fasta = function(){
    var content = ''

    fangorn.each_leaf(function(leaf){
      var raw_fasta = leaf.raw_fasta_entry()
      if (raw_fasta != null)
        content += raw_fasta
    })

    return content
  }

  // wrap phylotree nodes with fangorn nodes
  // prepare branches
  fangorn.reinit_nodes = function(){
    if (tree_is_loaded){
      _nodes = _tree.get_nodes().map(function(node){ return Node(fangorn, node) })

      _branches = []
      this.get_tree().get_svg().selectAll('.branch').each(function(b){ _branches.push(b) })
      _branches.forEach(function(b){
        b.source.next_branch = b
        b.target.prev_branch = b
        b.get_element = function(){ return d3.select("path[d='" + b.existing_path + "']") }
      })
    }
  }

  fangorn.fasta_is_loaded = function(){
    return fangorn.fasta != null
  }

  fangorn.init_fasta_sidebar = function(){
    var content = ''

    if (fangorn.fasta_is_loaded()){
      content = '<b class="ui-text">' + fangorn.fasta._out_filename + '</b></br>'
      fangorn.each_leaf(function(leaf){
        content += leaf.init_fasta_bar_entry()
      })
    } else {
      content += '<b class="ui-text">No fasta loaded...</b>'
    }

    $('#fasta-panel').html(content)
  }

  fangorn.dispatch_state_update = function(){
    var event = new Event('fangorn_state_update')
    document.dispatchEvent(event)
  }

  fangorn.each_leaf = function(f){
    fangorn.get_leaves().forEach(function(leaf){
      f(leaf)
    })
  }

  fangorn.update_node_title = function(node, title){
    if (!fangorn.fasta_is_loaded())
      return null

    var new_id = FastaRepresentation.extract_id(title)
    node.name = new_id
    node.fasta.id = new_id
    node.fasta.title = title

    fangorn.init_fasta_sidebar()
  }

  fangorn.reroot_to_selected_node = function(){
    var selection = fangorn.get_selection()

    if (selection.length == 1){
      var node = selection[0]
      fangorn.get_tree().reroot(node).update()
    }

    fangorn.reinit_nodes()
    fangorn.get_tree().update_zoom_transform()
    fangorn.get_tree().refresh()
  }

  fangorn.set_selected_nodes_annotation = function(annotation){
    fangorn.get_selection().forEach(function(node){
      Object.keys(annotation).forEach(function(key){
        node.parsed_annotation[key] = annotation[key]
      })
    })
  }

  fangorn.metadata_json = function(){
    result = {}

    if (fangorn.fasta_is_loaded()){
      removed_seqs = []

      fangorn.get_leaves().forEach(function(node){
        if (node.is_marked())
          removed_seqs.push(node.fasta)
      })

      if (removed_seqs.length > 0){
        result['removed_seqs'] = removed_seqs.map(function(e){ return e.to_fasta() }).join('')
        result['removed_seqs'] = btoa(pako.deflate(result['removed_seqs'], {to: 'string'}))
      }
    }

    return result;
  }

  fangorn.get_removed_fasta_metadata  = function(){
    var tree = fangorn.get_tree()

    if (!tree.is_nexus() || !tree.nexus.fangorn || !tree.nexus.fangorn.removed_seqs)
      return false

    var removed_seqs = tree.nexus.fangorn.removed_seqs
    removed_seqs = pako.inflate(atob(removed_seqs), {to: 'string'})



    return removed_seqs
  }

  return this
}

module.exports = Fangorn
