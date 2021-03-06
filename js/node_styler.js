class NodeStyler {
  constructor (node) {
    this.node = node
    this.preferences = node.fangorn.preferences
    this.drawn_shapes = []

    this.highlight_rect = null
    this.initHighlight()
  }

  style_leaf (dom_element) {
    this.setFontFamily(this.preferences.getPreference('taxaFontFamily'))
    this.setFontSize(this.preferences.getPreference('taxaFontSize'))
    this.setFontWeight(this.preferences.getPreference('taxaFontBold'))
    this.setFontStyle(this.preferences.getPreference('taxaFontItalic'))
    this.setFontUnderline(this.preferences.getPreference('taxaFontUnderline'))

    if (this.node.is_marked() == true){
      this.setFontWeight(true)
      this.setColor('#e6550d')
    }
  }

  style () {
    this.setColor(this.defaultColor())
    this.setWidth()

    for (var prop in this.node.parsed_annotation){
      var val = this.node.parsed_annotation[prop]

      if (prop === '!color') { this.setColor(val) }
    }
  }

  setFontFamily (value) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.fontFamily = value
    }
  }

  setFontSize (value) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.fontSize = value + 'px'
    }
  }

  setFontWeight (is_bold) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.fontWeight = is_bold ? 'bold' : 'normal'
    }
  }

  setFontStyle (is_italic) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.fontStyle = is_italic ? 'italic' : 'normal'
    }
  }

  setFontUnderline (is_underlined) {
    if (this.node.is_leaf()){
      var text = this.getLeafTextElement()
      text.style.textDecoration = is_underlined ? 'underline' : ''
    }
  }

  setColor (value){
    if (this.node.prev_branch){
      $(this.node.prev_branch.get_element()[0]).css('stroke', value)

      if (this.node.is_leaf()){
        $(this.node.get_html_element()).css('fill', value)
      }
    }
  }

  setWidth () {
    if (this.node.prev_branch) {
      var value = this.node.fangorn.preferences.getPreference('branchWidth')
      $(this.node.prev_branch.get_element()[0]).css('stroke-width', value + 'px')
    }
  }

  highlight () {
    if (this.highlight_rect) {
      this.highlight_rect.style('display', 'block')
    }
  }

  unhighlight () {
    if (this.highlight_rect) {
      this.highlight_rect.style('display', 'none')
    }
  }

  setHighlightColor (color) {
    if (this.highlight_rect) {
      this.highlight_rect.style('fill', color)
    }
  }

  defaultColor () {
    return this.node.fangorn.preferences.getPreference('branchColor')
  }

  getLeafTextElement () {
    return this.node.get_html_element().getElementsByTagName('text')[0]
  }

  initHighlight () {
    if (!this.node.is_leaf()) {
      return false
    }

    var container = this.node.container
    this.highlight_rect = d3.select(container).select('rect.highlight-rect')

    if (this.highlight_rect.empty()){
      var bbox = this.node.container.getBBox()

      this.highlight_rect = d3.select(container)
                              .insert('rect', ':first-child')
                              .attr('class', 'highlight-rect')
                              .attr('x', bbox.x)
                              .attr('y', bbox.y)
                              .attr('width', bbox.width)
                              .attr('height', bbox.height)
                              .style('fill', NodeStyler.HIGHLIGHT_COLOR)
                              .style('stroke', 'none')
                              .style('display', 'none')
    }
  }
}

NodeStyler.HIGHLIGHT_COLOR = '#fff308'

module.exports = NodeStyler;
