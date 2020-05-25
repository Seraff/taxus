function NodeStyler(node){
  styler = this
  this.node = node
  this.preferences = node.fangorn.preferences
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

    this.setFontFamily(this.preferences.getPreference('taxaFontFamily'))
    this.setFontSize(this.preferences.getPreference('taxaFontSize'))
    this.setFontWeight(this.preferences.getPreference('taxaFontBold'))
    this.setFontStyle(this.preferences.getPreference('taxaFontItalic'))
    this.setFontUnderline(this.preferences.getPreference('taxaFontUnderline'))
  }

  this.style = function(){
    this.setColor(this.defaultColor())
    this.setWidth()

    for (var prop in this.node.parsed_annotation){
      var val = this.node.parsed_annotation[prop]

      if (prop === '!color') { this.setColor(val) }
    }
  }

  this.setFontFamily = function (value) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.fontFamily = value
    }
  }

  this.setFontSize = function (value) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.fontSize = value + 'px'
    }
  }

  this.setFontWeight = function (is_bold) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.fontWeight = is_bold ? 'bold' : 'normal'
    }
  }

  this.setFontStyle = function (is_italic) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.fontStyle = is_italic ? 'italic' : 'normal'
    }
  }

  this.setFontUnderline = function (is_underlined) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.textDecoration = is_underlined ? 'underline' : ''
    }
  }

  this.setColor = function(value){
    if (this.node.prev_branch){
      $(this.node.prev_branch.get_element()[0]).css('stroke', value)
      if (this.node.is_leaf()){
        $(this.node.get_html_element()).css('fill', value)
      }
    }
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

  this.getLeafTextElement = function () {
    return this.node.get_html_element().getElementsByTagName('text')[0]
  }
}

module.exports = NodeStyler;
