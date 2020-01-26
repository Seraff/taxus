const $ = require('jquery')
var Mousetrap = require('mousetrap');
const nexus = require('./nexus.js');
const pako = require('pako')

function apply_extensions(phylotree){
  // console.log(phylotree)
  const basic_nexus_pattern = `#NEXUS
begin trees;
\ttree tree = [&R] %NEWICK%
end;
`

  var svg = phylotree.get_svg();
  var zoom_mode = false;

  phylotree.set_leaf_bgcolor = function(node, color){
    if (!node || !phylotree.is_leafnode(node) || !color) return null;

    // add rectangle with the

    return node;
  }

  $(window).on("keydown", function(e) {
    if (e.ctrlKey){
      svg.call(zoom);
      zoom_mode = true;
      $("#tree_display").css('cursor', 'grab');
    }
  });

  $(window).on("keyup", function(e) {
    svg.on(".zoom", null);
    zoom_mode = false;
    $("#tree_display").css('cursor', '');
  });

  phylotree.update_zoom_transform = function(){
    var translate = phylotree.current_transform;
    var scale = phylotree.current_zoom;

    d3.select("."+phylotree.get_css_classes()["tree-container"])
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
  }

  phylotree.current_transform = [0, 0];
  phylotree.current_zoom = 1;

  var zoom = d3.behavior.zoom()
    .scaleExtent([.1, 10])
    .on("zoom", function(){
      phylotree.current_transform = d3.event.translate;
      phylotree.current_zoom = d3.event.scale;

      var translate = d3.event.translate;

      translate[0] += phylotree.get_offsets()[1] + phylotree.get_options()["left-offset"];
      translate[1] += phylotree.pad_height();

      d3.select("."+phylotree.get_css_classes()["tree-container"])
        .attr("transform", "translate(" + translate + ")scale(" + d3.event.scale + ")");
    });

  /* Add link to SVG object to node */
  var _draw_node = phylotree.draw_node;

  phylotree.draw_node = function(container, node, transitions) {
    node.container = container;
    _draw_node(container, node, transitions);
  }


  /* rect selection */
  function rect(x, y, w, h) { return "M"+[x,y]+" l"+[w,0]+" l"+[0,h]+" l"+[-w,0]+"z"; }

  function valueInRange(value, min, max){ return (value >= min) && (value <= max); }

  function rects_overlap(A, B){
    xOverlap = valueInRange(A.x, B.x, B.x + B.width) || valueInRange(B.x, A.x, A.x + A.width);
    yOverlap = valueInRange(A.y, B.y, B.y + B.height) || valueInRange(B.y, A.y, A.y + A.height);

    return xOverlap && yOverlap;
  }

  var selection = svg.append("path")
    .attr("class", "selection")
    .attr("visibility", "hidden");

  svg.on("mousedown", function() {
    if (zoom_mode) return false;

    var _svg = svg[0][0];
    var subject = d3.select(window),
        start = d3.mouse(this);

    selection.attr("d", rect(start[0], start[0], 0, 0))
        .attr("visibility", "visible");

    leafs = phylotree.get_nodes().filter(function(n){ return phylotree.is_leafnode(n) });

    current_transform = d3.transform(d3.select("."+phylotree.get_css_classes()["tree-container"]).attr("transform"));

    leafs.forEach(function(n){
      n.bbox = d3.select(n.container).node().getBBox();

      var convert = makeAbsoluteContext(d3.select(n.container).node());

      n.bbox_translated = d3.select(n.container).node().getBBox();
      n.bbox_translated.x = (convert(n.bbox.x, n.bbox.y).x);
      n.bbox_translated.y = (convert(n.bbox.x, n.bbox.y).y);
      n.bbox_translated.width = n.bbox.width * current_transform.scale[0]
      n.bbox_translated.height = n.bbox.height * current_transform.scale[1]
    });

    // svg.append("rect")
    // .attr("x", leafs[3].bbox_translated.x)
    // .attr("y", leafs[3].bbox_translated.y)
    // .attr("width", leafs[3].bbox_translated.width)
    // .attr("height", leafs[3].bbox_translated.height)
    // .style("fill", "#ccc")
    // .style("fill-opacity", "0.5")
    // .style("stroke", "#red")
    // .style("stroke-width", "3px");

    subject
      .on("mousemove.selection", function() {
        var current = d3.mouse(_svg);
        selection.attr("d", rect(start[0], start[1], current[0]-start[0], current[1]-start[1]));
      }).on("mouseup.selection", function() {
        var finish = d3.mouse(_svg);
        var selection_rect = { x: Math.min(start[0], finish[0]),
                               y: Math.min(start[1], finish[1]),
                               width: Math.abs(start[0] - finish[0]),
                               height: Math.abs(start[1] - finish[1]) }
        var selected_leafs = leafs.filter(function(n){ return rects_overlap(selection_rect, n.bbox_translated) });
        phylotree.modify_selection(function(n){ return selected_leafs.includes(n.target) })
        selection.attr("visibility", "hidden");
        subject.on("mousemove.selection", null).on("mouseup.selection", null);
      });
  });

  phylotree.to_fangorn_newick = function(annotations = false){
    if (annotations){
      return phylotree.get_newick(function(e){ return e.annotation ? "[" + e.annotation + "]" : "" });
    } else {
      return phylotree.get_newick(function(e){ return "" });
    }
  }

  phylotree.translate_nodes = function(){
    var table = phylotree.get_translations()

    phylotree.get_nodes().forEach(function(n){
      if (Object.keys(table).includes(n.name))
        n.name = table[n.name];
    });
  }

  phylotree.detranslate_nodes = function(){
    var table = phylotree.get_translations()

    phylotree.get_nodes().forEach(function(n){
      var key = Object.keys(table).find(function(key){ return table[key] === n.name });
      if (key)
        n.name = key;
    });
  }

  phylotree.read_tree = function(str){
    var newick = null;
    var fangorn_block = null;
    phylotree.nexus = null;
    phylotree.original_newick = null;
    phylotree.original_file_template = null;

    str = $.trim(str);

    // if it looks like newick, make a basic nexus
    if (str[0] == '(' && str[str.length-1] == ';'){
      str = basic_nexus_pattern.replace("%NEWICK%", str);
    }

    // try with nexus
    var parsed_nexus = nexus.parse(str);

    if (parsed_nexus.status === nexus.NexusError.ok){
      // it is nexus
      phylotree.nexus = parsed_nexus;
      newick = phylotree.nexus.treesblock.trees[0].newick.match(/\(.+\)/)[0];
      phylotree.original_file_template = str.replace(newick, "%NWK%");

      fangorn_block = phylotree.original_file_template.match(/begin\s+fangorn\s*;\s.*?end\s*;/si);
      if (fangorn_block){
        fangorn_block = fangorn_block[0];
        phylotree.original_file_template = phylotree.original_file_template.replace(fangorn_block, "%FG_BLK%");
      }

    } else {
      newick = str;
      throw "Unable to open the tree file";
    }

    phylotree.original_newick = newick;

    phylotree(newick);

    if (phylotree.nexus)
      phylotree.translate_nodes(phylotree.get_translations());

    return phylotree;
  }

  phylotree.get_translations = function(){
    if (!phylotree.is_nexus())
      return {};

    return phylotree.nexus.treesblock.translate || {};
  }

  phylotree.is_nexus = function(){
    return phylotree.nexus != null;
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

      if (hasOwnProperty(phylotree.nexus.fangorn, 'removed_seqs')){
        var encoded = phylotree.nexus.fangorn.removed_seqs
        result['removed_seqs'] = pako.inflate(atob(encoded), {to: 'string'})
      }
    }

    return result
  }

  phylotree.output_tree = function(metadata_json){
    phylotree.get_nodes().forEach(function(n){
      n.build_annotation();
    });

    if (phylotree.is_nexus()){
      phylotree.detranslate_nodes(phylotree.get_translations());
      var newick = phylotree.to_fangorn_newick(true);

      phylotree.translate_nodes(phylotree.get_translations());

      var content = phylotree.original_file_template.replace("%NWK%", newick);

      var fangorn_block = phylotree.build_fangorn_block()

      if (fangorn_block.length > 0){
        if (content.includes("%FG_BLK%"))
          content = content.replace("%FG_BLK%", phylotree.build_fangorn_block())
        else
          content += "\n" + phylotree.build_fangorn_block()
      }

      return content
    } else
      return phylotree.to_fangorn_newick(true);
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
    var event = new Event('selection_modified');
    document.dispatchEvent(event);
  }

}

module.exports = apply_extensions;
