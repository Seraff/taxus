class AlignmentCoverageFeature {
  constructor (node) {
    this.node = node
    this.container = d3.select(this.node.container)
  }

  redraw () {
    this.remove()

    if (this.isEnabled()) {
      this.render()
    }
  }

  render () {
    if (!this.node.is_leaf() || !this.node.fasta_is_loaded()) {
      return false
    }

    var pct = this.getPct()
    var my_feature = this.getSelector()

    var text = this.container.append('text').text(pct).attr('class', 'feature alignment-coverage')
    var prev_text = text.select(function(){ return this.previousSibling })

    var prev_text_box = prev_text.node().getBBox()
    var x = prev_text_box.width + 10

    text.attr('dx', x)
    text.attr('dy', prev_text.attr('dy'))
  }

  remove () {
    if (this.isDrawn()) {
      this.getSelector().remove()
    }
  }

  isDrawn () {
    return !this.getSelector().empty()
  }

  getSelector () {
    return this.container.selectAll('.alignment-coverage')
  }

  isEnabled () {
    return this.node.taxus.preferences.getPreference('displayAlignmentCoverage') === true
  }

  getPct () {
    if (this.node.fasta_is_loaded()) {
      var seq = this.node.fasta().sequence
      var len = seq.length

      var gaps = null
      var gap_match = seq.match(/[Xx-]/g)
      if (!gap_match) {
        gaps = 0
      } else {
        gaps = gap_match.length
      }

      return (((len-gaps)/len)*100).toFixed(0) + '%'
    }

    return null
  }
}
