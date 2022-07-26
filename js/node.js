// Our phylotreejs node wrapper

function Node(taxus, phylotree_node){
  var node = phylotree_node

  // We don't need to wrap it again if it's already wrapped
  if (node.is_taxus_node) {
    return node
  }

  node.taxus = taxus
  node.is_taxus_node = true
  node.parsed_annotation = {}
  node.prev_branch = null

  node.features = []

  if (!hasOwnProperty(phylotree_node, 'fasta')){
    node.own_fasta = null
  }

  node.fasta = function () {
    return node.appliedFasta() || node.own_fasta
  }

  node.appliedFasta = function () {
    if (node.taxus.fastaIsLoaded()) {
      return node.taxus.fastaMapping.getFastaForNode(node)
    }
  }

  node.isLeaf = function(){
    return d3.layout.phylotree.is_leafnode(node)
  }

  node.isInternal = function(){
    return !node.isLeaf()
  }

  node.isRoot = function () {
    return node.parent === undefined
  }

  node.mark = function(){
    node.addAnnotation({ '!taxus_marked': true })
    node.own_fasta = node.fasta()
    node.taxus.makeTreeDirty()
    node.taxus.makeFastaDirty()
  }

  node.unmark = function(){
    node.removeAnnotation("!taxus_marked")
    node.taxus.makeTreeDirty()
    node.taxus.makeFastaDirty()
  }

  node.isMarked = function(){
    return node.parsed_annotation['!taxus_marked'] && node.parsed_annotation['!taxus_marked'] == true
  }

  node.style = function(dom_element){
    node.styler.style()

    if (node.isLeaf()){
      node.styler.styleLeaf(dom_element)
    } else {
      if (node.taxus.preferences.preferences.displayBootstrap === 'true'){
        node.addTipToNode(node.bootstrap())
      } else {
        node.removeNodeTip()
      }
    }
  }

  node.applyOwnFasta = function(fasta){
    if (fasta.id === node.name){
      node.own_fasta = fasta
    } else {
      console.error("Cannot apply fasta " + fasta.id + " to node " + node.name)
    }
  }

  node.fastaIsLoaded = function(){
    return node.fasta() != null
  }

  node.rawFastaEntry = function(){
    if (!node.fastaIsLoaded())
      return null

    content = '>' + node.fasta().id + '\n'
    content += node.fasta().sequence + '\n'

    return content
  }

  node.bootstrap = function(){
    if (node.isInternal()){
      return parseFloat(node.name)
    }
  }

  node.addTipToNode = function(text){
    if (node.isLeaf() || (!text && text !== 0)){
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

  node.removeNodeTip = function () {
    d3.select(node.container).select('.node-tip').remove()
  }

  node.getHtmlElement = function(){
    return node.isLeaf() ? node.container : node.prev_branch.get_element().node()
  }

  node.getBBox = function(){
    var bbox = node.getHtmlElement().getBBox()

    if (node.isLeaf()){
      transform = d3.transform(d3.select(node.getHtmlElement()).attr('transform'))
      bbox.x = bbox.x + transform.translate[0]
      bbox.y = bbox.y + transform.translate[1]
    }

    return bbox
  }

  node.parseAnnotation = function(){
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

  node.buildAnnotation = function(){
    var annotations = []
    Object.keys(node.parsed_annotation).forEach(function(k){
      annotations.push(k + "=" + node.parsed_annotation[k])
    })

    node.annotation = (annotations.length > 0) ? ("&" + annotations.join(',')) : ""
  }

  node.addAnnotation = function(annotation){
    Object.keys(annotation).forEach(function(k){
      node.parsed_annotation[k] = annotation[k]
    })

    node.buildAnnotation()
  }

  node.removeAnnotation = function(keys){
    if (typeof(keys) != Array)
      keys = [keys]

    keys.forEach(function(k){
      delete node.parsed_annotation[k]
    })

    node.buildAnnotation()
  }

  node.initFeatures = function () {
    if (!node.isLeaf()) { return false }

    node.features.push(new AlignmentCoverageFeature(node))
  }

  node.redraw_features = function () {
    if (!node.isLeaf()) { return false }

    node.features.forEach((f) => { f.redraw() })
  }

  node.initFeatures()
  node.parseAnnotation()

  node.styler = new NodeStyler(node)

  return node
}
