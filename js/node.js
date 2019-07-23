const FastaRepresentation = require('./fasta_representation.js');

function Node(fangorn, phylotree_node){
  var node = phylotree_node;
  var fangorn = fangorn;

  node.marked = false;

  node.is_leaf = function(){
    return d3.layout.phylotree.is_leafnode(node);
  }

  node.mark = function(){
    node.marked = true;
  }

  node.unmark = function(){
    node.marked = false;
  }

  node.style = function(dom_element){
    klass = dom_element.attr('class')

    if (node.marked == true){
      klass += " node-fangorn-marked"
      dom_element.attr('class', klass)
    }
  }

  node.apply_fasta = function(fasta){
    if (fasta.id == node.name)
      node.fasta = fasta;
    else
      console.error("Cannot apply fasta " + node.fasta.id + " to node " + node.name)
  }

  node.fasta_is_loaded = function(){
    return node.hasOwnProperty('fasta');
  }

  node.fasta_bar_entry = function(){
    if (!node.fasta_is_loaded())
      return '';

    klass = node.selected == true ? 'fasta-node-selected' : '';
    hidden = node.marked ? 'hidden' : '';
    content = '<span id="' + node.name + '" ' + hidden + ' class="' + klass + '">';
    content += "<b>>" + node.fasta.title + "</b><br>";
    content += node.fasta.seq + "<br></span>";

    return content;
  }

  node.raw_fasta_entry = function(){
    if (!node.fasta_is_loaded() || node.marked)
      return null;

    content = '>' + node.fasta.title + '\n';
    content += node.fasta.seq + '\n';

    return content;
  }

  return node;
}

module.exports = Node;
