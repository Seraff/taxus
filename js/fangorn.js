const Node = require('./node.js');
const FastaRepresentation = require('./fasta_representation.js');
const fs = require('fs');

function Fangorn(){
  var fangorn = this;
  var _nodes = null;
  var _tree_content = null;
  var _tree = null;
  var _fasta = null;

  fangorn.get_tree = function(){
    return _tree;
  }

  fangorn.tree_is_loaded = function(){
    return _tree != null;
  }

  fangorn.get_nodes = function(){
    return _nodes;
  }

  fangorn.get_leaves = function(){
    return _nodes.filter(function(node){ return node.is_leaf() });
  }

  fangorn.get_leave_names = function(){
    return fangorn.get_leaves().map(function(node){ return node.name });
  }

  fangorn.nodes_are_loaded = function(){
    return _nodes.length > 0;
  }

  fangorn.get_fasta = function(){
    return _fasta;
  }

  fangorn.get_selection = function(){
    return fangorn.get_tree().get_selection();
  }

  fangorn.get_selected_leaves = function(){
    return fangorn.get_selection().filter(function(node){ return node.is_leaf() });
  }

  fangorn.get_selected_edges = function(){
    return fangorn.get_selection().filter(function(node){ return node.is_edge() });
  }

  fangorn.is_one_leaf_selected = function(){
    return fangorn.get_selected_leaves().length == 1;
  }

  // by design zero or only one edge can be selected
  fangorn.is_one_edge_selected = function(){
    return fangorn.get_selected_edges().length == 1;
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
                selectable: true
               });

    function edgeStyler(dom_element, edge_object) {
      var coloring_scheme = d3.scale.category20c();
      dom_element.style(coloring_scheme(edge_object.target.cluster));
    }

    function nodeStyler(dom_element, node_object) {
      if (node_object.style){
        node_object.style(dom_element);
      }
    }

    apply_extensions(_tree);
    _tree.node_circle_size(0);
    _tree.style_edges(edgeStyler);
    _tree.style_nodes(nodeStyler);
    _tree(str).layout();
    d3.select(".phylotree-container").attr("align","center");

    document.addEventListener('selection_modified', function(e){
      fangorn.dispatch_state_update();
    });

    _fasta = null;
    fangorn.init_fasta_sidebar();
    fangorn.dispatch_state_update();
  }

  fangorn.load_tree = function(path){
    try {
      _tree_content = fs.readFileSync(path, 'utf8');
      init_phylotree(_tree_content);
      _nodes = _tree.get_nodes().map(function(node){ return Node(fangorn, node) });
    } catch(err) {
      console.error(err);
    }
  }

  fangorn.load_tree_from_text = function(txt){
    _tree_content = txt;
    init_phylotree(_tree_content);
    _nodes = _tree.get_nodes().map(function(node){ return Node(fangorn, node) });
  }

  fangorn.load_fasta = function(path){
    _fasta = FastaRepresentation(path);
    _fasta.addEventListener('loaded', function(e){
      if (!_fasta.check_consistency(fangorn.get_leave_names())){
        _fasta = null;
      } else {
        fangorn.each_leaf(function(leaf){
          leaf.apply_fasta(_fasta.sequences[leaf.name]);
        })
        fangorn.init_fasta_sidebar()
        fangorn.dispatch_state_update();
      }
    });
  }

  fangorn.save_fasta = function(){
    var content = '';

    fangorn.each_leaf(function(leaf){
      var raw_fasta = leaf.raw_fasta_entry();
      if (raw_fasta != null)
        content += raw_fasta;
    });

    fs.writeFile(_fasta.out_path, content, function(err) {
      if(err) {
        return console.error(err);
      }
    });
   }

  fangorn.fasta_is_loaded = function(){
    return _fasta != null;
  }

  fangorn.init_fasta_sidebar = function(){
    var content = '';

    if (fangorn.fasta_is_loaded()){
      content = '<b class="ui-text">' + _fasta._out_filename + '</b></br>'
      fangorn.each_leaf(function(leaf){
        content += leaf.init_fasta_bar_entry()
      });
    } else {
      content += '<b class="ui-text">No fasta loaded...</b>'
    }

    $('#fasta-panel').html(content);
  }

  fangorn.dispatch_state_update = function(){
    var event = new Event('fangorn_state_update');
    document.dispatchEvent(event);
  }

  fangorn.each_leaf = function(f){
    fangorn.get_leaves().forEach(function(leaf){
      f(leaf);
    })
  }

  fangorn.update_node_title = function(node, title){
    if (!fangorn.fasta_is_loaded())
      return null;

    var new_id = FastaRepresentation.extract_id(title);
    node.name = new_id;
    node.fasta.id = new_id;
    node.fasta.title = title;

    fangorn.init_fasta_sidebar()
  }

  fangorn.reroot_to_selected_node = function(){
    var selection = fangorn.get_selection();

    if (selection.length == 1){
      node = selection[0];
      fangorn.get_tree().reroot(node).update();
    }
  }

  return this;
}

module.exports = Fangorn;
