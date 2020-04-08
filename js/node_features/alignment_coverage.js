class AlignmentCoverage {
  constructor (node) {
    this.node = node
    this.container = d3.select(this.node.container)
  }

  redraw () {
    if (!this.node.is_leaf()) { return false }


    if (this.node.fasta) {
      var pct = this.getPct()

      var container = d3.select(this.node.container)
      var my_feature = this.container.selectAll('.alignment-coverage')

      if (this.node.fangorn.preferences.preferences.displayAlignmentCoverage == 'true') {
        if (my_feature.empty()) {
          var text = this.container.append('text').text(pct).attr('class', 'feature alignment-coverage')
          var prev_text = text.select(function(){ return this.previousSibling })
          var prev_text_box = prev_text.node().getBBox()
          var x = prev_text_box.width + 10

          text.attr('dx', x)
          text.attr('dy', prev_text.attr('dy'))

        } else {
          my_feature.text(pct)
        }

      } else {
        if (!my_feature.empty()) { my_feature.remove() }
      }
    }
  }

  getPct () {
    if (this.node.fasta) {
      var seq = this.node.fasta.sequence
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

module.exports = AlignmentCoverage
