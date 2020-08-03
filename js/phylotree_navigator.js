const GeometryHelper = require('./geometry_helper.js')

class PhylotreeNavigator {
  constructor (phylotree, zoom) {
    this.$svg = $('svg#tree_display')
    this.$tree_pane = $('#tree-pane')
    this.svg = phylotree.get_svg();

    this.phylotree = phylotree
    this.zoom = zoom

    // this.drawGrid()
  }

  // For debugging
  drawGrid () {
    var step = 100

    for (var i=step; i<=1000; i+=step) {
      this.svg.insert('rect')
      .attr('x', i)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', 50)
      .style('fill', 'red')
      .style('stroke', 'none')

      this.svg.insert('rect')
      .attr('x', 0)
      .attr('y', i)
      .attr('width', 50)
      .attr('height', 1)
      .style('fill', 'red')
      .style('stroke', 'none')
    }

    var svg_width = this.$svg.width()
    var svg_height = this.$svg.height()

    this.svg.insert('rect')
      .attr('x', svg_width/2)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', svg_height)
      .style('fill', 'grey')
      .style('stroke', 'none')

    this.svg.insert('rect')
      .attr('x', 0)
      .attr('y', svg_height/2)
      .attr('width', svg_width)
      .attr('height', 1)
      .style('fill', 'grey')
      .style('stroke', 'none')
  }

  drawRect (x, y, width, height, fill='red') {
    this.svg.insert('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('opacity', 0.5)
      .style('fill', fill)
      .style('stroke', 'none')
  }

  panToLeaf (node) {
    if (!node.is_leaf()) {
      return false
    }

    var transform = this.phylotree.get_current_transform()
    var current_zoom = transform.scale[0]

    var original_bbox = node.getBBox()
    original_bbox.x += this.phylotree.get_offsets()[1]

    var node_x = original_bbox.x
    var node_y = original_bbox.y + ((original_bbox.height)/2)

    var trans_x = (this.$svg.width()/2) + (this.phylotree.get_offsets()[1] - node_x)*current_zoom
    var trans_y = (this.$svg.height()/2) - (node_y*current_zoom)

    transform.translate[0] = trans_x
    transform.translate[1] = trans_y

    this.phylotree.current_translate = transform.translate

    d3.select("." + this.phylotree.get_css_classes()["tree-container"])
        .attr("transform", "translate(" + transform.translate + ")scale(" + transform.scale + ")");

    this.zoom.translate(transform.translate)

    this.phylotree.redraw_scale_bar()
  }

  scaleToFit () {
    var container = d3.select("." + this.phylotree.get_css_classes()["tree-container"])

    var tree_height = container.node().getBBox().height + 150
    var tree_width = container.node().getBBox().width + 150

    var window_height = this.$tree_pane[0].offsetHeight
    var window_width = this.$tree_pane[0].offsetWidth

    var new_zoom = Math.min(window_height/tree_height, window_width/tree_width)
    var new_translate = [10, 10]

    this.phylotree.current_translate = new_translate
    this.phylotree.current_zoom = new_zoom

    d3.select("." + this.phylotree.get_css_classes()["tree-container"])
      .attr("transform", "translate(" + new_translate + ")scale(" + new_zoom + ")")

    this.zoom.scale(new_zoom)
    this.zoom.translate(new_translate)

    this.phylotree.redraw_scale_bar()
  }

  getTreeScreenBBox () {
    var container = d3.select("." + this.phylotree.get_css_classes()["tree-container"])
    var treeBBox = container.node().getBBox()
    var transform = this.phylotree.get_current_transform()
    treeBBox = GeometryHelper.globalToScreen(transform, treeBBox)

    treeBBox.height += 50
    treeBBox.width += 20
    treeBBox.x -= 10
    treeBBox.y -= 10

    return treeBBox
  }
}

module.exports = PhylotreeNavigator
