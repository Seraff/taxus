const FastaRepresentation = require('./fasta_representation.js');
const NodeStyler = require('./node_styler.js');

parse_annotation = function(annotation){
  var result = {};

  if (!annotation || annotation.length <= 0)
    return result;

  var values = annotation.replace(/^&!/g, '').split(/,!/);

  values.forEach(function(e){
    var splitted = e.split('=');
    result[splitted[0]] = splitted[1];
  });

  return result;
}

function Node(fangorn, phylotree_node){
  var node = phylotree_node;
  var fangorn = fangorn;
  var fasta_bar_entry_selector = null;


  node.is_fangorn_node = true;
  node.marked = false;

  node.prev_branch = null;
  node.next_branch = null;

  node.parsed_annotation = parse_annotation(phylotree_node.annotation);
  node.styler = new NodeStyler(node);

  node.is_leaf = function(){
    return d3.layout.phylotree.is_leafnode(node);
  }

  node.is_internal = function(){
    return !node.is_leaf();
  }

  node.mark = function(){
    node.marked = true;
  }

  node.unmark = function(){
    node.marked = false;
  }

  node.style = function(dom_element){
    node.styler.style();

    if (node.is_leaf()){
      node.styler.style_leaf(dom_element);
    } else {
      node.add_tip(node.bootstrap());
    }
    // dom_element.attr('style', "fill: blue !important;")
  }


  node.apply_fasta = function(fasta){
    if (fasta.id == node.name)
      node.fasta = fasta;
    else
      console.error("Cannot apply fasta " + node.fasta.id + " to node " + node.name)
  }

  node.fasta_is_loaded = function(){
    return node.hasOwnProperty('fasta');
  }

  node.get_fasta_bar_entry = function(){
    if (node.fasta_bar_entry_selector != null)
      return $(node.fasta_bar_entry_selector);
    else
      return null
  }

  node.init_fasta_bar_entry = function(){
    if (!node.fasta_is_loaded())
      return '';

    var rnd = Math.random().toString(36).substring(7);
    klass = node.selected == true ? 'fasta-node-selected' : '';
    hidden = node.marked ? 'hidden' : '';
    content = '<span id="' + rnd + '" ' + hidden + ' class="' + klass + '">';
    content += "<b>>" + node.fasta.title + "</b><br>";
    content += node.fasta.seq + "<br></span>";
    node.fasta_bar_entry_selector = "span#"+rnd;

    return content;
  }

  node.raw_fasta_entry = function(){
    if (!node.fasta_is_loaded() || node.marked)
      return null;

    content = '>' + node.fasta.title + '\n';
    content += node.fasta.seq + '\n';

    return content;
  }

  node.bootstrap = function(){
    if (node.is_internal()){
      return parseFloat(node.name)
    }
  }

  node.add_tip = function(text){
    if (node.is_leaf() || !text)
      return;


    d3.select(node.container).html("");
    d3.select(node.container).append("text")
               .classed("bootstrap", true)
               .text(text)
               .attr("dx", ".3em")
               .attr("text-anchor", "start")
               .attr("alignment-baseline", "middle");
  }

  node.get_html_element = function(){
    return node.is_leaf() ? node.container : node.prev_branch.get_element().node();
  }

  node.getBBox = function(){
    var bbox = node.get_html_element().getBBox();

    if (node.is_leaf()){
      transform = d3.transform(d3.select(node.get_html_element()).attr('transform'));
      bbox.x = bbox.x + transform.translate[0];
      bbox.y = bbox.y + transform.translate[1];
    }

    return bbox;
  }

  node.getTranslatedBBox = function(){
    var bbox = node.getBBox();
    var translated_bbox = bbox;

    var current_transform = d3.transform(d3.select("."+fangorn.get_tree().get_css_classes()["tree-container"]).attr("transform"));
    var convert = makeAbsoluteContext(d3.select(node.get_html_element()).node());

    translated_bbox.x = (convert(bbox.x, bbox.y).x);
    translated_bbox.y = (convert(bbox.x, bbox.y).y);
    translated_bbox.width = bbox.width * current_transform.scale[0]
    translated_bbox.height = bbox.height * current_transform.scale[1]

    return translated_bbox;
  }

  return node;
}

module.exports = Node;
