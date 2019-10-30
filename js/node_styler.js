e = null
n = null;

function NodeStyler(node){
  styler = this;
  this.node = node;
  this.drawn_shapes = [];

  this.style_leaf = function(dom_element){
    if (this.node.marked == true){
      var klass = dom_element.attr('class');
      klass += " node-fangorn-marked";
      dom_element.attr('class', klass);
    }

    if (this.node.fasta_is_loaded()){
      var fasta_entry = this.node.get_fasta_bar_entry();

      if (this.node.selected == true){
        fasta_entry.addClass('fasta-node-selected');
      } else {
        fasta_entry.removeClass("fasta-node-selected");
      }

      if (this.node.marked == true){
        $(fasta_entry).hide();
      } else {
        $(fasta_entry).show();
      }
    }
  }

  this.style = function(){
    for (var prop in this.node.parsed_annotation){
      var val = this.node.parsed_annotation[prop];

      if (prop === 'color')
        this.redraw_color_annotation(val);

      if (prop === 'hilight')
        this.redraw_hilight_annotation(val);

    }
  }

  this.redraw_color_annotation = function(value){
    this.node.prev_branch.get_element().attr('style', "stroke: " + value + " !important");
  }

  this.redraw_hilight_annotation = function(value){
    return 0;
    styler.drawn_shapes.forEach(function(sh){ sh.remove() });
    styler.drawn_shapes = [];

    var el = this.node.prev_branch.get_element();
    var color = value.match(/#\w+/)[0];
    e = el;
    n = this.node;

    var rects = this.node.children.map(function(nd){ return nd.getBBox() });
    console.log(rects)

    var min_x = el.node().getBBox().x;
    var min_y = Math.min(...rects.map(function(rect){ return rect.y }));
    var max_x = Math.max(...rects.map(function(rect){ return rect.x + rect.width }));
    var max_y = Math.max(...rects.map(function(rect){ return rect.y + rect.height }));
    var width = Math.abs(max_x) - Math.abs(min_x) + 10;
    var height = Math.abs(max_y) - Math.abs(min_y);

    var bbox = this.node.getBBox();
    var bbox_t = this.node.getTranslatedBBox();

    var rect = d3.select('.phylotree-container').append('rect').attr("x", min_x).attr("y", min_y).attr("height", height).attr("width", width).attr('fill', color);
    styler.drawn_shapes.push(rect);

    var first_el = d3.select('.phylotree-container').node().firstChild;
    d3.select('.phylotree-container').node().insertBefore(rect.node(), first_el);
  }

}

module.exports = NodeStyler;
