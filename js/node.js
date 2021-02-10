const FastaRepresentation = require('./fasta_representation.js')
const NodeStyler = require('./node_styler.js')
const features = require('./node_features')

// Our phylotreejs node wrapper

function Node(fangorn, phylotree_node){
  var node = phylotree_node

  // We don't need to wrap it again if it's already wrapped
  if (node.is_fangorn_node) {
    return node
  }

  node.fangorn = fangorn
  node.is_fangorn_node = true
  node.parsed_annotation = {}
  node.prev_branch = null

  node.features = []

  if (!hasOwnProperty(phylotree_node, 'fasta')){
    node.own_fasta = null
  }

  node.fasta = function () {
    return node.applied_fasta() || node.own_fasta
  }

  node.applied_fasta = function () {
    if (node.fangorn.fasta_is_loaded()) {
      return node.fangorn.fastaMapping.getFastaForNode(node)
    }
  }

  node.is_leaf = function(){
    return d3.layout.phylotree.is_leafnode(node)
  }

  node.is_internal = function(){
    return !node.is_leaf()
  }

  node.is_root = function () {
    return node.parent === undefined
  }

  node.mark = function(){
    node.add_annotation({ '!fangorn_marked': true })
    node.own_fasta = node.fasta()
    node.fangorn.make_tree_dirty()
    node.fangorn.make_fasta_dirty()
  }

  node.unmark = function(){
    node.remove_annotation("!fangorn_marked")
    node.fangorn.make_tree_dirty()
    node.fangorn.make_fasta_dirty()
  }

  node.is_marked = function(){
    return node.parsed_annotation['!fangorn_marked'] && node.parsed_annotation['!fangorn_marked'] == true
  }

  node.style = function(dom_element){
    node.styler.style()

    if (node.is_leaf()){
      node.styler.style_leaf(dom_element)
    } else {
      if (node.fangorn.preferences.preferences.displayBootstrap === 'true'){
        node.add_tip_to_node(node.bootstrap())
      } else {
        node.remove_node_tip()
      }
    }
  }

  node.apply_own_fasta = function(fasta){
    if (fasta.id === node.name){
      node.own_fasta = fasta
    } else {
      console.error("Cannot apply fasta " + fasta.id + " to node " + node.name)
    }
  }

  node.fasta_is_loaded = function(){
    return node.fasta() != null
  }

  node.raw_fasta_entry = function(){
    if (!node.fasta_is_loaded())
      return null

    content = '>' + node.fasta().id + '\n'
    content += node.fasta().sequence + '\n'

    return content
  }

  node.bootstrap = function(){
    if (node.is_internal()){
      return parseFloat(node.name)
    }
  }

  node.add_tip_to_node = function(text){
    if (node.is_leaf() || (!text && text !== 0)){
      return
    }

    d3.select(node.container).html("")
    d3.select(node.container).append("text")
               .classed("node-tip", true)
               .text(text)
               .attr("dx", ".3em")
               .attr("text-anchor", "start")
               .attr("alignment-baseline", "middle")
  }

  node.remove_node_tip = function () {
    d3.select(node.container).select('.node-tip').remove()
  }

  node.get_html_element = function(){
    return node.is_leaf() ? node.container : node.prev_branch.get_element().node()
  }

  node.getBBox = function(){
    var bbox = node.get_html_element().getBBox()

    if (node.is_leaf()){
      transform = d3.transform(d3.select(node.get_html_element()).attr('transform'))
      bbox.x = bbox.x + transform.translate[0]
      bbox.y = bbox.y + transform.translate[1]
    }

    return bbox
  }

  node.parse_annotation = function(){
    var result = {}

    if (!node.annotation){
      node.parsed_annotation = result
      return
    }

    var values = node.annotation.replace(/&/g, '').split(',')

    values.forEach(function(e){
      var splitted = e.split('=')
      var val = splitted[1]

      if (val === "true")
        val = true
      else if (val === "false")
        val = false

      result[splitted[0]] = val
    })

    node.parsed_annotation = result
  }

  node.build_annotation = function(){
    var annotations = []
    Object.keys(node.parsed_annotation).forEach(function(k){
      annotations.push(k + "=" + node.parsed_annotation[k])
    })

    node.annotation = (annotations.length > 0) ? ("&" + annotations.join(',')) : ""
  }

  node.add_annotation = function(annotation){
    Object.keys(annotation).forEach(function(k){
      node.parsed_annotation[k] = annotation[k]
    })

    node.build_annotation()
  }

  node.remove_annotation = function(keys){
    if (typeof(keys) != Array)
      keys = [keys]

    keys.forEach(function(k){
      delete node.parsed_annotation[k]
    })

    node.build_annotation()
  }

  node.init_features = function () {
    if (!node.is_leaf()) { return false }

    node.features.push(new features.AlignmentCoverage(node))
  }

  node.redraw_features = function () {
    if (!node.is_leaf()) { return false }

    node.features.forEach((f) => { f.redraw() })
  }

  node.init_features()
  node.parse_annotation()

  node.styler = new NodeStyler(node)

  return node
}

module.exports = Node
