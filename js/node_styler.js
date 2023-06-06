class NodeStyler {
  constructor(node) {
    this.node = node
    this.preferences = node.taxus.preferences
    this.drawn_shapes = []
    this.removedTaxaColor = '#e6550d'

    this.highlight_rect = null
    this.initHighlight()
  }

  styleLeaf(dom_element) {
    this.setFontFamily(this.preferences.getPreference('taxaFontFamily'))
    this.setFontSize(this.preferences.getPreference('taxaFontSize'))
    this.setFontWeight(this.preferences.getPreference('taxaFontBold'))
    this.setFontStyle(this.preferences.getPreference('taxaFontItalic'))
    this.setFontUnderline(this.preferences.getPreference('taxaFontUnderline'))

    if (this.node.isMarked() == true){
      this.setFontWeight(true)
      this.setFontLineThrough(true)
    } else {
      this.setFontLineThrough(false)
    }
  }

  style() {
    this.setColor(this.defaultColor())
    this.setLeafTextColor(this.defaultColor())
    this.setWidth()

    for (let prop in this.node.parsed_annotation) {
      let val = this.node.parsed_annotation[prop]
      if (prop === '!color') { this.setColor(val) }
    }

    if (this.node.isLeaf()) {
      for (let prop in this.node.parsed_taxablock_annotation) {
        let val = this.node.parsed_taxablock_annotation[prop]
        if (prop === '!color') { this.setLeafTextColor(val) }
      }
    }
  }

  setFontFamily(value) {
    if (this.node.isLeaf()){
      var text = this.getLeafTextElement()
      text.style.fontFamily = value
    }
  }

  setFontSize(value) {
    if (this.node.isLeaf()){
      var text = this.getLeafTextElement()
      text.style.fontSize = value + 'px'
    }
  }

  setFontWeight(is_bold) {
    if (this.node.isLeaf()){
      var text = this.getLeafTextElement()
      text.style.fontWeight = is_bold ? 'bold' : 'normal'
    }
  }

  setFontStyle(is_italic) {
    if (this.node.isLeaf()){
      var text = this.getLeafTextElement()
      text.style.fontStyle = is_italic ? 'italic' : 'normal'
    }
  }

  setFontUnderline(is_underlined) {
    if (this.node.isLeaf()){
      var text = this.getLeafTextElement()

      if (!text.style.textDecoration) {
        text.style.textDecoration = ''
      }

      if (is_underlined) {
        text.style.textDecoration += ' underline'
      } else {
        text.style.textDecoration = text.style.textDecoration.replace('underline', '').trim()
      }
    }
  }

  setFontLineThrough(is_line_through) {
    if (this.node.isLeaf()) {
      var text = this.getLeafTextElement()

      if (!text.style.textDecoration) {
        text.style.textDecoration = ''
      }

      if (is_line_through) {
        text.style.textDecoration += ' line-through'
      } else {
        text.style.textDecoration = text.style.textDecoration.replace('line-through', '').trim()
      }
    }
  }

  setColor(value){
    if (this.node.prev_branch){
      $(this.node.prev_branch.get_element()[0]).css('stroke', value)
    }
  }

  setLeafTextColor(value){
    if (this.node.isLeaf()) {
      $(this.node.getHtmlElement()).css('fill', value)
    }
  }

  setWidth() {
    if (this.node.prev_branch) {
      var value = this.node.taxus.preferences.getPreference('branchWidth')
      $(this.node.prev_branch.get_element()[0]).css('stroke-width', value + 'px')
    }
  }

  highlight() {
    if (this.highlight_rect) {
      this.highlight_rect.style('display', 'block')
    }
  }

  unhighlight() {
    if (this.highlight_rect) {
      this.highlight_rect.style('display', 'none')
    }
  }

  setHighlightColor(color) {
    if (this.highlight_rect) {
      this.highlight_rect.style('fill', color)
    }
  }

  defaultColor() {
    return this.node.taxus.preferences.getPreference('branchColor')
  }

  getLeafTextElement() {
    return this.node.getHtmlElement().getElementsByTagName('text')[0]
  }

  initHighlight() {
    if (!this.node.isLeaf()) {
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
