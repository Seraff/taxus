function NodeStyler(node){
  styler = this
  this.node = node
  this.drawn_shapes = []

  this.style_leaf = function(dom_element){
    if (this.node.is_marked() == true){
      var klass = dom_element.attr('class')
      klass += " node-fangorn-marked"
      dom_element.attr('class', klass)
    }

    if (this.node.fasta_is_loaded()){
      var pane = styler.node.fangorn.fasta_pane

      if (this.node.selected == true){
        pane.highlight_entry_for_node(node)
      } else {
        pane.unhighlight_entry_for_node(node)
      }

      if (this.node.is_marked() == true){
        pane.hide_entry_for_node(node)
      } else {
        pane.unhide_entry_for_node(node)
      }
    }
  }

  this.style = function(){
    this.setColor(this.defaultColor())
    this.setWidth()

    for (var prop in this.node.parsed_annotation){
      var val = this.node.parsed_annotation[prop]

      if (prop === 'color') { this.setColor(val) }
    }
  }

  this.setColor = function(value){
    if (this.node.prev_branch)
      $(this.node.prev_branch.get_element()[0]).css('stroke', value)
  }

  this.setWidth = function(){
    if (this.node.prev_branch) {
      var value = this.node.fangorn.preferences.getPreference('branchWidth')
      $(this.node.prev_branch.get_element()[0]).css('stroke-width', value + 'px')
    }
  }

  this.defaultColor = function() {
    return this.node.fangorn.preferences.getPreference('branchColor')
  }
}

module.exports = NodeStyler;
