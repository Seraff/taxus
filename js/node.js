const FastaRepresentation = require('./fasta_representation.js');

function Node(fangorn, phylotree_node){
  var node = phylotree_node;
  var fangorn = fangorn;
  var fasta_bar_entry_selector = null;

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
    if (!node.is_leaf()){
      return true;
    }

    var element = node.get_fasta_bar_entry();

    if (node.marked == true){
      var klass = dom_element.attr('class');
      klass += " node-fangorn-marked";
      dom_element.attr('class', klass);
      $(element).hide();
    } else {
      $(element).show();
    }

    if (node.fasta_is_loaded()){
      if (node.selected == true){
        element.addClass('fasta-node-selected');
      } else {
        element.removeClass("fasta-node-selected");
      }
    }
  }

  // node.style_fasta

  node.apply_fasta = function(fasta){
    if (fasta.id == node.name)
      node.fasta = fasta;
    else
      console.error("Cannot apply fasta " + node.fasta.id + " to node " + node.name)
  }

  node.fasta_is_loaded = function(){
    return node.hasOwnProperty('fasta');
  }

  node.get_fasta_bar_entry = function(){
    if (node.fasta_bar_entry_selector != null)
      return $(node.fasta_bar_entry_selector);
    else
      return null
  }

  node.init_fasta_bar_entry = function(){
    if (!node.fasta_is_loaded())
      return '';

    var rnd = Math.random().toString(36).substring(7);
    klass = node.selected == true ? 'fasta-node-selected' : '';
    hidden = node.marked ? 'hidden' : '';
    content = '<span id="' + rnd + '" ' + hidden + ' class="' + klass + '">';
    content += "<b>>" + node.fasta.title + "</b><br>";
    content += node.fasta.seq + "<br></span>";
    node.fasta_bar_entry_selector = "span#"+rnd;

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
