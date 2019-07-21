
function Node(fangorn, phylotree_node){
  var node = phylotree_node;
  var fangorn = fangorn;

  node.marked = false;

  node.is_leaf = function(){
    return d3.layout.phylotree.is_leafnode(node);
  }

  node.mark = function(){
    node.marked = true;
    // fangorn.get_tree().update();
  }

  node.unmark = function(){
    node.marked = false;
    // fangorn.get_tree().update();
  }

  node.style = function(dom_element){
    klass = dom_element.attr('class')

    if (node.marked == true){
      klass += " node-fangorn-marked"
      dom_element.attr('class', klass)
    }
  }

  return node;
}

module.exports = Node;
