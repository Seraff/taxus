const fs = require('fs')
const Node = require('./node.js')
const FastaRepresentation = require('./fasta_representation.js')
const apply_extensions = require('./phylotree-ext.js')

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
    if (!path)
      path = fangorize_path(fangorn.tree_path)

    var data = fangorn.get_tree().output_tree()
    fs.writeFileSync(path, data, 'utf8')
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
    var consistency = fasta_rep.check_consistency(fangorn.get_leave_names())

    if (consistency != true){
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

      fangorn.each_leaf(function(leaf){
        leaf.apply_fasta(fasta_rep.sequences[leaf.name])
      })

      fangorn.init_fasta_sidebar()
      fangorn.dispatch_state_update()
      fangorn.get_tree().refresh()
    }
  }

  fangorn.save_fasta = function(){
    var content = fangorn.output_fasta()

    fs.writeFile(fangorn.fasta.out_path, content, function(err) {
      if(err) {
        return console.error(err)
      }
    })
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

  fangorn.save_project = function(path){
    data = {}
    data['tree_path'] = fangorn.tree_path
    data['tree_str'] = fangorn.get_tree().output_tree()

    if (fangorn.fasta_is_loaded()){
      data['fasta_path'] = fangorn.fasta.path
      data['original_fasta_str'] = fangorn.fasta.original_str
    }
    fs.writeFileSync(path, JSON.stringify(data), 'utf8')
  }

  fangorn.open_project = function(path){
    var str = fs.readFileSync(path, 'utf8')
    var json = JSON.parse(str)

    fangorn.tree_path = json['tree_path']
    fangorn.load_tree_string(json['tree_str'])

    if (json['fasta_path'] && json['original_fasta_str']){
      fangorn.fasta = new FastaRepresentation()
      fangorn.fasta.path = json['fasta_path']
      fangorn.load_fasta_string(json['original_fasta_str'])
    }
  }

  return this
}

module.exports = Fangorn
