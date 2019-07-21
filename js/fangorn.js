const fs = require('fs');
const Fasta = require('biojs-io-fasta');
const Node = require('./node.js');

function Fangorn(){
  var fangorn = this;
  var _nodes = null;
  var _tree_content = null;
  var _tree = null;
  var _fasta_seqs = null;
  var _fasta_path = null;

  fangorn.get_tree = function(){
    return _tree;
  }

  fangorn.get_nodes = function(){
    return _nodes;
  }

  fangorn.get_leaves = function(){
    return _nodes.filter(function(node){ return node.is_leaf() });
  }

  fangorn.nodes_are_loaded = function(){
    return _nodes.length > 0;
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
      if (node_object.style)
        node_object.style(dom_element);
    }

    apply_extensions(_tree);
    _tree.node_circle_size(0);
    _tree.style_edges(edgeStyler);
    _tree.style_nodes(nodeStyler);
    _tree(str).layout();
    d3.select(".phylotree-container").attr("align","center");
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
    if (!nodes_are_loaded()){
      return false;
    }

    var contents;

    try {
      contents = fs.readFileSync(path, 'utf8');
    } catch(err) {
      console.error(err);
    }

    _fasta_seqs = Fasta.parse(contents);

    return _fasta_seqs ? true : false;
  }

  // check_fasta = function(){
  //   if (_fasta_seqs == null){
  //     return true;
  //   }

  //   var
  //   _fasta_seqs.filter(function(seq){  });
  // }

  return this;
}

module.exports = Fangorn;
