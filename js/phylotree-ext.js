const $ = require('jquery')
const pako = require('pako')
require('path-data-polyfill')

PhylotreeNavigator = require('./phylotree_navigator.js')
const nexus = require('./nexus.js')
const GeometryHelper = require('./geometry_helper.js')

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

function apply_extensions(phylotree){
  const basic_nexus_pattern = `#NEXUS
begin trees;
\ttree tree = [&R] %NEWICK%
end;
`

  var $svg = $('svg#tree_display')
  var $window = $(window)
  var $tree_display = $("#tree_display")

  var svg = phylotree.get_svg()
  var zoom_mode = false
  var shift_mode = false
  var selection_mode = 'taxa'
  var scale_bar = true

  $window.unbind("keydown", onkeydown)
  $window.unbind("keyup")
  $window.unbind("wheel")
  $window.unbind("focus")

  $window.on("keydown", onkeydown)

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
      var delta = e.shiftKey ? 15 : 5

      switch(e.code){
        case('ArrowUp'):
          phylotree.move("S", delta)
          break
        case('ArrowDown'):
          phylotree.move("N", delta)
          break
        case('ArrowLeft'):
          phylotree.move("E", delta)
          break
        case('ArrowRight'):
          phylotree.move("W", delta)
          break
      }
    }
  }

  $window.on('focus', function(e) {
    phylotree.exit_zoom_mode()
    phylotree.exit_shift_mode()
  })

  $window.on("keyup", function(e) {
    if (e.key == 'Control'){
      phylotree.exit_zoom_mode()
    } else if (e.key == 'Shift') {
      phylotree.exit_shift_mode()
    }
  })

  $window.on("wheel", function(e) {
    var cursor_above_tree = ($("#tree-pane:hover").length != 0)

    if (!zoom_mode && cursor_above_tree){
      if (e.originalEvent.deltaY < 0) {
        phylotree.move("S", 10)
      } else if (e.originalEvent.deltaY > 0) {
        phylotree.move("N", 10)
      } else if (e.originalEvent.deltaX < 0) {
        phylotree.move("E", 5)
      } else if (e.originalEvent.deltaX > 0) {
        phylotree.move("W", 5)
      }
    }
  })

  phylotree.enter_zoom_mode = function(){
    svg.call(zoom)
    zoom_mode = true
    $tree_display.css('cursor', 'grab')
  }

  phylotree.exit_zoom_mode = function(){
    svg.on(".zoom", null)
    zoom_mode = false
    $tree_display.css('cursor', '')
  }

  phylotree.enter_shift_mode = function(){
    shift_mode = true
  }

  phylotree.exit_shift_mode = function(){
    shift_mode = false
  }

  phylotree.original_update = phylotree.update

  phylotree.update = function(transitions, safe=false){
    phylotree.original_update(transitions, safe)
    phylotree.init_scale_bar()
    phylotree.redraw_scale_bar() // We draw scale bar in different way
  }

  phylotree.original_safe_update = phylotree.safe_update

  phylotree.safe_update = function(transitions){
    phylotree.original_safe_update(transitions)
    phylotree.init_scale_bar()
    phylotree.redraw_scale_bar() // We draw scale bar in different way
  }

  phylotree.update_zoom_transform = function(){
    var translate = phylotree.current_translate
    var scale = phylotree.current_zoom

    d3.select("."+phylotree.get_css_classes()["tree-container"])
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")")
  }

  phylotree.current_translate = [0, 0]
  phylotree.current_zoom = 1

  // Zoom and Pan event
  var zoom = d3.behavior.zoom()
    .scaleExtent([.1, 10])
    .on("zoom", function(){
      phylotree.current_translate = d3.event.translate
      phylotree.current_zoom = d3.event.scale

      var translate = d3.event.translate

      translate[0] += phylotree.get_offsets()[1] + phylotree.get_options()["left-offset"]
      translate[1] += phylotree.pad_height()

      d3.select("." + phylotree.get_css_classes()["tree-container"])
        .attr("transform", "translate(" + translate + ")scale(" + d3.event.scale + ")")

      // Scale bar stuff

      phylotree.redraw_scale_bar()

    })

  phylotree.move = function(direction, delta = 5) {
    var transform = phylotree.get_current_transform()

    switch(direction){
      case "N":
        transform.translate[1] -= delta
        break
      case "S":
        transform.translate[1] += delta
        break
      case "W":
        transform.translate[0] -= delta
        break
      case "E":
        transform.translate[0] += delta
        break
    }

    phylotree.current_translate = transform.translate

    d3.select("." + phylotree.get_css_classes()["tree-container"])
        .attr("transform", "translate(" + transform.translate + ")scale(" + transform.scale + ")")

    zoom.translate(transform.translate)

    phylotree.redraw_scale_bar()
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

  // Returns absolute coordinates of the element after all the pan/zoom transformations
  function get_leaf_geometry (node) {
    var current_transform = get_current_transform()
    var bbox = d3.select(node.container).node().getBBox()
    var convert = makeAbsoluteContext(d3.select(node.container).node())

    var bbox_translated = {}
    bbox_translated.x = (convert(bbox.x, bbox.y).x)
    bbox_translated.y = (convert(bbox.x, bbox.y).y)
    bbox_translated.width = bbox.width * current_transform.scale[0]
    bbox_translated.height = bbox.height * current_transform.scale[1]

    return [bbox_translated]
  }

  function get_branch_geometry (node) {
    if (!node.prev_branch) {
      return []
    }

    var current_transform = get_current_transform()
    var branch = node.prev_branch
    var bbox = branch.get_element().node().getBBox()
    var convert = makeAbsoluteContext(branch.get_element().node())

    var bbox_translated = {}
    bbox_translated.x = (convert(bbox.x, bbox.y).x)
    bbox_translated.y = (convert(bbox.x, bbox.y).y)
    bbox_translated.width = bbox.width * current_transform.scale[0]
    bbox_translated.height = bbox.height * current_transform.scale[1]

    // detect, if the branch ┌─ or └─

    var path_data = branch.get_element().node().getPathData()
    var branch_goes_up = path_data[0].values[1] > path_data[1].values[0]

    geometry = []

    // adding | line
    geometry.push({ x: bbox_translated.x, y: bbox_translated.y, width: 0, height: bbox_translated.height })

    //adding ── line
    if (branch_goes_up) {
      geometry.push({ x: bbox_translated.x, y: bbox_translated.y, width: bbox_translated.width, height: 0 })
    } else {
      geometry.push({ x: bbox_translated.x, y: bbox_translated.y + bbox_translated.height, width: bbox_translated.width, height: 0 })
    }

    return geometry
  }

  function rect_overlaps_geometry (rect, geometry) {
    return geometry.some( (g) => { return GeometryHelper.rectsOverlap(rect, g) } )
  }

  var selection = svg.append("path")
    .attr("class", "selection")
    .attr("visibility", "hidden")

  svg.on("mousedown", function() {
    if (zoom_mode) return false

    var _svg = svg[0][0]
    var subject = d3.select(window)
    var start = d3.mouse(this)

    selection.attr("d", GeometryHelper.rect(start[0], start[0], 0, 0))
        .attr("visibility", "visible")

    nodes = phylotree.get_nodes().filter(function(n){ return selection_mode == 'taxa' ? phylotree.is_leafnode(n) : true })

    nodes.forEach(function(n){
      n.geometry = (selection_mode == 'taxa') ? get_leaf_geometry(n) : get_branch_geometry(n)
    })

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

        var to_select = nodes.filter(function(n){ return rect_overlaps_geometry(selection_rect, n.geometry) })
        var selected = phylotree.get_selection()

        if (shift_mode) {
          if (to_select.length === 1 && selected.includes(to_select[0])) {
            to_select = selected.filter((n) => { return to_select[0] != n })
          } else {
            to_select = to_select.concat(selected)
          }
        }

        phylotree.modify_selection(function(n){ return to_select.includes(n.target) })

        selection.attr("visibility", "hidden")
        subject.on("mousemove.selection", null).on("mouseup.selection", null)
      })
  })

  // Branches and taxa selection-by-click logic
  document.addEventListener('d3.layout.phylotree.event', function(e) {
    if (e.detail[0] === 'count_update') {

      // Branch selection in branch mode
      d3.selectAll('path.branch').on('click', null)

      d3.selectAll('path.branch').on('mousedown', function(e){
        d3.event.stopPropagation()
      })

      d3.selectAll('path.branch').on('mouseup', function(e){
        if (selection_mode === 'branch') {
          var to_select = [e.target]
          var selected = phylotree.get_selection()

          if (shift_mode) {
            if (selected.includes(to_select[0])){
              to_select = selected.filter((n) => { return to_select[0] != n })
            } else {
              to_select = to_select.concat(selected)
            }
          }

          phylotree.modify_selection(function(n){ return to_select.includes(n.target) })
        }
      })

      // Taxa selection in taxa mode
      d3.selectAll('g.node').on('mousedown', null)
      d3.selectAll('g.node').on('mouseup', null)
      d3.selectAll('g.node').on('mousemove', null)
    }
  })

  phylotree.to_fangorn_newick = function(annotations = false){
    if (annotations){
      return phylotree.get_newick(function(e){ return e.annotation ? "[" + e.annotation + "]" : "" })
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

  phylotree.read_tree = function(str){
    var newick = null
    var fangorn_block = null

    phylotree.nexus = null
    phylotree.original_newick = null
    phylotree.original_file_template = null

    str = $.trim(str)

    // if it looks like newick, make a basic nexus
    if (str[0] == '(' && str[str.length-1] == ';'){
      phylotree.original_newick = str
      str = basic_nexus_pattern.replace("%NEWICK%", str)
    }

    // str is nexus now, parse it, check it
    var parsed_nexus = nexus.parse(str)
    if (parsed_nexus.status === nexus.NexusError.ok){
      // it is nexus
      phylotree.nexus = parsed_nexus

      if (phylotree.nexus.treesblock === undefined ||
          phylotree.nexus.treesblock.trees === undefined ||
          phylotree.nexus.treesblock.trees.length <= 0) {
        throw new NexusError("No trees found in the file")
      }

      newick = phylotree.nexus.treesblock.trees[0].newick.match(/^(\[.+?\])?(.+)(?=\;)/)[2]

      phylotree.original_newick = newick
      phylotree.original_file_template = str.replace(newick, "%NWK%")

      fangorn_block = phylotree.original_file_template.match(/begin\s+fangorn\s*;\s.*?end\s*;/si)
      if (fangorn_block){
        fangorn_block = fangorn_block[0]
        phylotree.original_file_template = phylotree.original_file_template.replace(fangorn_block, "%FG_BLK%")
      }

    } else {
      var error = nexus.NexusErrorHumanized(parsed_nexus.status)
      throw new NexusError("Error in nexus file (" + error + ")")
    }

    // check newick
    var newick_test = d3.layout.newick_parser(phylotree.original_newick)
    if (newick_test.error !== null) {
      throw new NewickError("Error in newick line (" + newick_test.error + ")")
    }

    try {
      phylotree(phylotree.original_newick)
    } catch (err) {
      throw new PhylotreeError("Phylotree library cannot read the file (" + err + ")")
    }

    if (phylotree.nexus)
      phylotree.translate_nodes(phylotree.get_translations())

    return phylotree
  }

  phylotree.get_translations = function(){
    if (!phylotree.is_nexus())
      return {}

    return phylotree.nexus.treesblock.translate || {}
  }

  phylotree.is_nexus = function(){
    return phylotree.nexus != null
  }

  // Metadata comes from Fangorn in it's format (when saving)
  phylotree.apply_fangorn_metadata = function(json){
    if (phylotree.is_nexus()){
      if (hasOwnProperty(json, 'removed_seqs')){
        json.removed_seqs = btoa(pako.deflate(json.removed_seqs, {to: 'string'}))
      }

      phylotree.nexus.fangorn = json
    }
  }

  // Convert metadata to Fangorn format (when opening)
  phylotree.nexus_to_fangorn_metadata = function(){
    var result = {}

    if (hasOwnProperty(phylotree.nexus, 'fangorn')) {
      Object.assign(result, phylotree.nexus.fangorn)

      if (hasOwnProperty(phylotree.nexus.fangorn, 'removed_seqs')) {
        var encoded = phylotree.nexus.fangorn.removed_seqs
        result['removed_seqs'] = pako.inflate(atob(encoded), {to: 'string'})
      }
    }

    return result
  }

  phylotree.taxlabels_data = function(){
    var taxablock = phylotree.nexus.taxablock
    if (taxablock === undefined ||
        taxablock.constructor !== Object ||
        taxablock.taxlabels === undefined ||
        !Array.isArray(taxablock.taxlabels))
      return {}

    var taxlabels = taxablock.taxlabels
    var result = {}
    var last_label = null

    taxlabels.forEach(function(label){
      if (label.match(/^\[.+\]$/)){
        var attrs = label.match(/\w+\=.+?(?=[,\]])/g)
        attrs.forEach(function(attr){
          var kv = attr.split('=')
          result[last_label][kv[0]] = kv[1]
        })
      } else {
        result[label] = {}
        last_label = label
      }
    })

    return result
  }

  phylotree.output_tree = function(metadata_json){
    var func = function (metadata_json) {

      phylotree.get_nodes().forEach(function(n){
        n.build_annotation()
      })

      var result = null

      if (phylotree.is_nexus()){
        phylotree.detranslate_nodes(phylotree.get_translations())
        var newick = phylotree.to_fangorn_newick(true)

        phylotree.translate_nodes(phylotree.get_translations())

        var content = phylotree.original_file_template.replace("%NWK%", newick)
        var fangorn_block = phylotree.build_fangorn_block()

        if (fangorn_block.length > 0){
          if (content.includes("%FG_BLK%"))
            content = content.replace("%FG_BLK%", phylotree.build_fangorn_block())
          else
            content += "\n" + phylotree.build_fangorn_block()
        }

        result = content
      } else {
        result = phylotree.to_fangorn_newick(true)
      }

      return result
    }


    return phylotree.withOriginalBranchLengths(func)(metadata_json)
  }

  phylotree.build_fangorn_block = function(){
    var result = ""

    if (phylotree.is_nexus() && Object.keys(phylotree.nexus.fangorn).length > 0){
      result += "begin fangorn;\n"
      for (var key in phylotree.nexus.fangorn){
        result += "\tset " + key + "=\"" + phylotree.nexus.fangorn[key] + "\";\n"
      }
      result += "end;\n"
    }

    return result
  }

  phylotree.dispatch_selection_modified_event = function () {
    // Fangorn stuff
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
    translate[1] = ((tree_container.getBBox().height + 20) * scale) + tree_transform.translate[1]

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
    return phylotree.get_nodes().find(function (n) { return n.is_root() })
  }

  phylotree.rotate_branch = function (node) {
    if (node.is_leaf()) {
      return false
    }

    var new_children = [node.children[node.children.length-1], node.children[0]]

    node.children = new_children

    var prev_branch = new_children[0].prev_branch
    new_children[0].prev_branch = new_children[1].prev_branch
    new_children[1].prev_branch = prev_branch

    phylotree.update_layout(phylotree.get_nodes()[0], true)
    fangorn.get_tree().safe_update()
  }

  // Navigator

  phylotree.navigator = new PhylotreeNavigator(phylotree, zoom)

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

module.exports = apply_extensions
