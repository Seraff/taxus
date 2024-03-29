const pako = window.modules.pako
// require('path-data-polyfill')

class NexusError extends Error {
  constructor(message) {
    super(message)
    this.name = "NexusError"
  }
}

class NewickError extends Error {
  constructor(message) {
    super(message)
    this.name = "NewickError"
  }
}

class PhylotreeError extends Error {
  constructor(message) {
    super(message)
    this.name = "PhylotreeError"
  }
}

function applyPhylotreeExtensions(phylotree){
  const basic_nexus_pattern = `#NEXUS
begin trees;
\ttree tree = [&R] %NEWICK%
end;
`

  var $svg = $('svg#tree_display')
  var $tree_pane = $('div#tree-pane')
  var $window = $(window)
  var $document = $(document)
  var $d3_container = d3.select("."+phylotree.get_css_classes()["tree-container"])

  var svg = phylotree.get_svg()
  var zoom_mode = false
  var shift_mode = false
  var selection_mode = 'taxa'
  var scale_bar = true
  const ARROW_SCROLL_DEFAULT = 15
  const ARROW_SCROLL_FAST = 30
  var scroll_pos = { top: 0, left: 0, x: 0, y: 0 };

  phylotree.phylotree_navigator = new PhylotreeNavigator(phylotree)

  phylotree.unbindTaxusEvents = function () {
    $window.off("keydown")
    $window.off("keyup")
    $window.off("focus")

    $document.off('tree_topology_changed')
    $document.off('new_tree_is_loaded')

    svg.on("mousedown", null)
    $svg.off("mousedown")
  }

  phylotree.unbindTaxusEvents()

  $window.on("keydown", onkeydown)
  $window.on("keyup", onkeyup)
  $window.on('focus', onfocus)

  $document.on('tree_topology_changed', on_tree_topology_changed)
  $document.on('new_tree_is_loaded', on_new_tree_is_loaded)

  function onkeydown (e) {
    if (e.target.tagName !== 'BODY') {
      return true
    }

    if (e.ctrlKey){
      phylotree.enter_zoom_mode()
    } else if (e.shiftKey) {
      phylotree.enter_shift_mode()
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      var delta = e.shiftKey ? ARROW_SCROLL_FAST : ARROW_SCROLL_DEFAULT

      switch(e.code){
        case('ArrowUp'):
          phylotree.move("N", delta)
          break
        case('ArrowDown'):
          phylotree.move("S", delta)
          break
        case('ArrowLeft'):
          phylotree.move("W", delta)
          break
        case('ArrowRight'):
          phylotree.move("E", delta)
          break
      }
    }
  }

  function onfocus (e) {
    phylotree.exit_zoom_mode()
    phylotree.exit_shift_mode()
  }

  function onkeyup (e) {
    if (e.key == 'Control'){
      phylotree.exit_zoom_mode()
    } else if (e.key == 'Shift') {
      phylotree.exit_shift_mode()
    }
  }

  phylotree.zoomIn = function(smooth=false) {
    phylotree.add_zoom(smooth ? 0.1 : 0.3)
  }

  phylotree.zoomOut = function(smooth=false) {
    phylotree.add_zoom(smooth ? -0.1 : -0.3)
  }

  phylotree.enter_zoom_mode = function(){
    zoom_mode = true
    $svg.css('cursor', 'grab')
  }

  phylotree.exit_zoom_mode = function(){
    zoom_mode = false
    $svg.css('cursor', '')
  }

  phylotree.enter_shift_mode = function(){
    shift_mode = true
  }

  phylotree.exit_shift_mode = function(){
    shift_mode = false
  }

  phylotree.is_shift_mode = function(){
    return shift_mode
  }

  phylotree.original_update = phylotree.update

  phylotree.update = function(transitions, safe=false){
    phylotree.original_update(transitions, safe)

    phylotree.init_scale_bar()
    phylotree.redraw_scale_bar() // We draw scale bar in different way
    phylotree.update_svg_size()
  }

  phylotree.original_safe_update = phylotree.safe_update

  phylotree.safe_update = function(transitions){
    phylotree.original_safe_update(transitions)

    phylotree.init_scale_bar()
    phylotree.redraw_scale_bar()
    phylotree.update_svg_size()
  }

  phylotree.update_svg_size = function(){
    var bbox = svg.node().getBBox()
    var width = bbox.width + bbox.x
    var height = bbox.height + bbox.y

    if (width < $tree_pane.width()) { width = $tree_pane.width() }
    if (height < $tree_pane.height()) { height = $tree_pane.height() }

    svg.attr('width', width)
       .attr('height', height)
  }

  phylotree.current_translate = [0, 0]
  phylotree.current_zoom = 1

  phylotree.move = function(direction, delta) {
    var element = document.getElementById('tree-pane')

    switch(direction){
      case "N":
        element.scroll(element.scrollLeft, element.scrollTop - delta)
        break
      case "S":
        element.scroll(element.scrollLeft, element.scrollTop + delta)
        break
      case "W":
        element.scroll(element.scrollLeft - delta, element.scrollTop)
        break
      case "E":
        element.scroll(element.scrollLeft + delta, element.scrollTop)
        break
    }
  }

  phylotree.moveToNode = function(node) {
    node.getHtmlElement().scrollIntoView()

    phylotree.move('N', 20)
    phylotree.move('W', 20)
  }

  phylotree.add_zoom = function(delta) {
    var transform = phylotree.get_current_transform()
    var new_zoom = transform.scale[0] + delta

    phylotree.current_zoom = new_zoom

    d3.select("."+phylotree.get_css_classes()["tree-container"])
       .attr("transform", "translate(" + transform.translate + ")scale(" + new_zoom + ")")

    phylotree.safe_update()
    phylotree.update_svg_size()
  }

  /* Add link to SVG object to node */
  var _draw_node = phylotree.draw_node

  phylotree.draw_node = function(container, node, transitions) {
    node.container = container
    _draw_node(container, node, transitions)
  }

  function get_current_transform () {
    return d3.transform(d3.select("."+phylotree.get_css_classes()["tree-container"]).attr("transform"))
  }

  // Returns global coordinates of the element
  function get_leaf_geometry (node) {
    if (node) {
      return [node.getBBox()]
    } else {
      return []
    }
  }

  function get_branch_geometry (node) {
    if (!node || !node.prev_branch || !node.prev_branch.get_element().node()) {
      return []
    }

    var branch = node.prev_branch
    var bbox = branch.get_element().node().getBBox()

    // detect, if the branch ┌─ or └─
    var path_data = branch.get_element().node().getPathData()
    var branch_goes_up = path_data[0].values[1] > path_data[1].values[0]

    geometry = []

    // adding | line
    geometry.push({ x: bbox.x-1, y: bbox.y, width: 2, height: bbox.height })

    //adding ── line
    if (branch_goes_up) {
      geometry.push({ x: bbox.x, y: bbox.y-1, width: bbox.width, height: 2 })
    } else {
      geometry.push({ x: bbox.x, y: bbox.y + bbox.height - 1, width: bbox.width, height: 2 })
    }

    return geometry
  }

  // For debugging purposes
  phylotree.drawGeometryBoundaries = function () {
    phylotree.get_nodes().forEach((n) => {
      var nav = new PhylotreeNavigator(phylotree)

      if (!n.is_taxus_node) {
        return null
      }

      if (!phylotree.is_leafnode(n)) {
        if (!n.branch_geometry) {
          return false
        }

        n.branch_geometry.forEach((g) => {
          var screen_box = GeometryHelper.globalToScreen(get_current_transform(), g)
          nav.drawRect (screen_box.x, screen_box.y, screen_box.width, screen_box.height)
        })
      }
    })
  }

  phylotree.dumpNodesGeometry = function () {
    phylotree.get_nodes().forEach((n) => {
      if (!n.is_taxus_node) {
        return null
      }

      n.branch_geometry = n.prev_branch ? get_branch_geometry(n) : []

      if (phylotree.is_leafnode(n)) {
        n.leaf_geometry = get_leaf_geometry(n)
      }
    })
  }

  function rect_overlaps_geometry (rect, geometry) {
    if (!geometry) {
      return false
    }

    return geometry.some( (g) => { return GeometryHelper.rectsOverlap(rect, g) } )
  }

  var selection = svg.append("path")
    .attr("class", "selection")
    .attr("visibility", "hidden")

  function onZoomMouseMove(e) {
    if (!zoom_mode) {
      return
    }

    const dx = e.clientX - scroll_pos.x
    const dy = e.clientY - scroll_pos.y

    $tree_pane.scrollTop(scroll_pos.top - dy)
    $tree_pane.scrollLeft(scroll_pos.left - dx)
  }

  function onZoomMouseDown(e) {
    if (!zoom_mode) {
      return
    }

    scroll_pos = {
      left: $tree_pane.scrollLeft(),
      top: $tree_pane.scrollTop(),
      x: e.clientX,
      y: e.clientY,
    }

    $svg.on('mousemove', onZoomMouseMove)
    $svg.on('mouseup', onZoomMouseUp)
  }

  function onZoomMouseUp() {
    $svg.off('mouseup', onZoomMouseUp)
    $svg.off('mousemove', onZoomMouseMove)
  }

  $svg.on('mousedown', onZoomMouseDown)

  svg.on("mousedown", function() {
    if (zoom_mode) {
      return false
    }

    var _svg = svg[0][0]
    var subject = d3.select(window)
    var start = d3.mouse(this)

    selection.attr("d", GeometryHelper.rect(start[0], start[0], 0, 0))
        .attr("visibility", "visible")

    subject
      .on("mousemove.selection", function() {
        var current = d3.mouse(_svg)
        selection.attr("d", GeometryHelper.rect(start[0], start[1], current[0]-start[0], current[1]-start[1]))
      }).on("mouseup.selection", function() {
        var finish = d3.mouse(_svg)
        var selection_rect = { x: Math.min(start[0], finish[0]),
                               y: Math.min(start[1], finish[1]),
                               width: Math.abs(start[0] - finish[0]),
                               height: Math.abs(start[1] - finish[1]) }

        if (selection_rect.width == 0 && selection_rect.height == 0){
          selection_rect.width = 1
          selection_rect.height = 1
        }

        var current_transform = get_current_transform()
        var selection_rect_glob = GeometryHelper.screenToGlobal(current_transform, selection_rect)

        var nodes = phylotree.get_nodes().filter(function(n){ return selection_mode === 'taxa' ? phylotree.is_leafnode(n) : true })

        var to_select = nodes.filter(function(n){
          var geometry = (selection_mode === 'taxa') ? n.leaf_geometry : n.branch_geometry
          return rect_overlaps_geometry(selection_rect_glob, geometry)
        })

        var selected = phylotree.get_selection()

        if (shift_mode) {
          if (to_select.length === 1 && selected.includes(to_select[0])) {
            to_select = selected.filter((n) => { return to_select[0] != n })
          } else {
            to_select = to_select.concat(selected)
          }
        }

        // selection is modified, but refresh is skipped
        phylotree.modify_selection(function(n){ return to_select.includes(n.target) },
                                   undefined,
                                   undefined,
                                   true)

        phylotree.refreshSpecific(to_select.concat(selected))

        selection.attr("visibility", "hidden")
        subject.on("mousemove.selection", null).on("mouseup.selection", null)
      })
  })

  // We don't want to trigger full refresh every time we selected the node
  phylotree.original_draw_node = phylotree.draw_node

  phylotree.draw_node = function(container, node, transitions) {
    phylotree.original_draw_node(container, node, transitions)

    container = d3.select(container)
    container.on("mousedown", null)
    container.on("mousemove", null)
    container.on("mouseup", null)
  }

  phylotree.original_draw_edge = phylotree.draw_edge

  // We don't want phylotreejs edge click event be in conflict with our handlers
  phylotree.draw_edge = function(container, edge, transition) {
    phylotree.original_draw_edge(container, edge, transition)

    d3.select(container).on("click", null)
  }

  function on_tree_topology_changed () {
    phylotree.dumpNodesGeometry()
  }
  function on_new_tree_is_loaded () {
    phylotree.dumpNodesGeometry()
  }

  phylotree.to_taxus_newick = function(annotations = false){
    if (annotations){
      return phylotree.get_newick(function(e){
        let annotation = e.stringifiedAnnotation()
        return annotation.length > 0 ? "[" + annotation + "]" : ""
      })
    } else {
      return phylotree.get_newick(function(e){ return "" })
    }
  }

  phylotree.translate_nodes = function(){
    var table = phylotree.get_translations()

    phylotree.get_nodes().forEach(function(n){
      if (Object.keys(table).includes(n.name))
        n.name = table[n.name]
    })
  }

  phylotree.detranslate_nodes = function(){
    var table = phylotree.get_translations()

    phylotree.get_nodes().forEach(function(n){
      var key = Object.keys(table).find(function(key){ return table[key] === n.name })
      if (key)
        n.name = key
    })
  }

  phylotree.get_translations = function(){
    if (!phylotree.is_nexus())
      return {}

    return phylotree.nexus.treesblock.translate || {}
  }

  phylotree.is_nexus = function(){
    return phylotree.nexus != null
  }

  phylotree.dispatch_selection_modified_event = function () {
    // taxus stuff
    var event = new Event('selection_modified')
    document.dispatchEvent(event)
  }

  // Scale bar stuff

  function d3_phylotree_svg_translate(x) {
    if (x && (x[0] !== null || x[1] !== null))
      return (
        "translate (" +
        (x[0] !== null ? x[0] : 0) +
        "," +
        (x[1] !== null ? x[1] : 0) +
        ") "
      )

    return ""
  }

  phylotree.init_scale_bar = function () {
    phylotree.get_svg().selectAll(".tree-scale-bar").remove()

    var scale = d3.scale.linear()

    var tree_width = phylotree.size()[1] - phylotree.get_offsets()[1] - phylotree.options()['left-offset']
    var width_per_taxa_len = tree_width / phylotree.extents[1][1]

    var bar_width = tree_width / 4
    var bar_width_in_taxa_len = bar_width / width_per_taxa_len

    scale.domain([0, bar_width_in_taxa_len])
         .range([0, bar_width])

    var draw_scale_bar = d3.svg
                           .axis()
                           .scale(scale)
                           .orient("top")
                           .ticks(0)
                           .tickSize(2)

    phylotree.get_svg()
             .selectAll(".tree-scale-bar")
             .data([0])
             .enter()
             .append('g')
             .attr("class", "tree-scale-bar")
             .call(draw_scale_bar)

    d3.select('.tree-scale-bar')
      .append('text')
      .attr('class', 'caption')
      .attr('x', bar_width/2)
      .attr('y', 10)
      .attr('font-size', 8)
      .style("text-anchor", "middle")
      .text(bar_width_in_taxa_len.toFixed(2))
  }

  phylotree.redraw_scale_bar = function () {
    var bar = d3.select("." + phylotree.get_css_classes()["tree-scale-bar"])

    if (!scale_bar) {
      bar.style('visibility', 'hidden')
      return true
    }

    bar.style('visibility', 'visible')

    var tree_transform = phylotree.get_current_transform()
    var tree_container = d3.select("." + phylotree.get_css_classes()["tree-container"]).node()

    var scale = tree_transform.scale[0]
    var translate = []
    translate[0] = tree_transform.translate[0] + (tree_container.getBBox().width*0.4*scale)
    translate[1] = (tree_container.getBBox().height * scale) + tree_transform.translate[1]
    translate[1] += phylotree.get_fixed_width()[0] * 0.5 + 5

    bar.attr("transform", "translate(" + translate + ")scale(" + scale + ")")
  }

  phylotree.get_current_transform = function () {
    return d3.transform(d3.select("." + phylotree.get_css_classes()["tree-container"]).attr('transform'))
  }

  phylotree.pad_height = function () { return 0; }

  // Selection mode

  phylotree.set_selection_mode = function (new_mode) {
    if (['taxa', 'branch'].includes(new_mode)) {
      selection_mode = new_mode
    }
  }

  // Rotate branch feature

  phylotree.get_root = function () {
    return phylotree.get_nodes().find(function (n) { return n.isRoot() })
  }

  phylotree.rotate_branch = function (node) {
    if (node.isLeaf()) {
      return false
    }

    var new_children = [node.children[node.children.length-1], node.children[0]]

    node.children = new_children

    phylotree.update_layout(phylotree.get_nodes()[0], true)
    taxus.getTree().safe_update()
  }

  // Order nodes feature

  phylotree.order_nodes = function (order) {
    if (!['ASC', 'DESC', 'ORIGINAL'].includes(order)){
      return false
    }

    let root = phylotree.get_root()

    let sort_nodes = function(parent){
      let children = parent.children ? parent.children : []

      if (children.length === 0) {
        return true
      } else {
        let unsorted = parent.children

        let sorted = unsorted.sort((a, b) => {
          let a_len = phylotree.descendants(a).length
          let b_len = phylotree.descendants(b).length

          if (order === 'ASC')
            return a_len - b_len
          else if (order === 'DESC')
            return b_len - a_len
          else if (order === 'ORIGINAL')
            return a.original_child_order - b.original_child_order
        })

        parent.children = sorted
      }

      parent.children.forEach((e) => { sort_nodes(e) })
    }

    sort_nodes(root)

    phylotree.update_layout(phylotree.get_nodes()[0], true)
    taxus.getTree().safe_update()
  }


  // Modifying tree in cladogram view workarounds

  // decorator
  phylotree.withOriginalBranchLengths = function (func, update = false) {
    return function() {
      var was_cladogram = phylotree.cladogram
      phylotree.cladogram = false

      const result = func.apply(this, arguments)

      if (was_cladogram) {
        phylotree.cladogram = true
        if (update) {
          phylotree.update_layout(phylotree.get_nodes()[0], true)
          phylotree.safe_update()
        }
      }

      return result
    }
  }

  original_reroot = phylotree.reroot

  phylotree.reroot = function (node) {
    phylotree.withOriginalBranchLengths(original_reroot, true)(node)
  }

  // Cladogram
  phylotree.setCladogramView = function (is_cladogram) {
    phylotree.cladogram = is_cladogram
    if (is_cladogram) {
      scale_bar = false
    } else {
      scale_bar = true
    }
    phylotree.update_layout(phylotree.get_root(), true)
    phylotree.redraw_scale_bar()
  }

}
