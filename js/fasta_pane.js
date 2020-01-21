const $ = require('jquery')
const Path = require('path')

function FastaPane(){
  var pane = this

  pane.fasta_is_loaded = false
  pane.title = null
  pane.entries = {}
  pane.nodes = {}

  pane.set_title_from_path = function(path){
    pane.title = Path.basename(path)
  }

  pane.draw_fasta = function(nodes){
    pane.entries = {}
    var content = ''

    if (nodes.length === 0){
      pane.show_no_fasta()
      return true
    }

    nodes.forEach(function(node){
      if (!node.fasta_is_loaded()){
        pane.fasta_is_loaded = false
        pane.show_no_fasta()
        return true
      }

      var current_content = pane.register_node(node)

      content += current_content
    })

    content = '<b class="ui-text">' + pane.title + '</b></br>' + content
    $('#fasta-panel').html(content)

    pane.fasta_is_loaded = true
  }

  pane.register_node = function(node){
    if (!node.fasta_is_loaded())
      return '';

    var rnd = Math.random().toString(36).substring(2);
    klass = node.selected == true ? 'selected' : '';
    hidden = node.is_marked() ? 'hidden' : '';
    content = '<span id="' + rnd + '" ' + hidden + ' class="fasta-pane-entry ' + klass + '">';
    content += "<span class='fasta-pane-entry-header'>>" + node.fasta.header + "</span><br>";
    content += "<span class='fasta-pane-entry-sequence'>" + node.fasta.sequence + "</span><br></span>";

    pane.entries[node.fasta.id] = "span#"+rnd
    pane.nodes[rnd] = node

    return content;
  }

  pane.show_no_fasta = function(){
    $('#fasta-panel').html('<b class="ui-text">Fasta is not loaded...</b>')
  }

  pane.select_entry_by_node = function(node){
    return $(pane.entries[node.fasta.id])
  }

  pane.highlight_entry_for_node = function(node){
    $(pane.entries[node.fasta.id]).addClass('selected')
  }

  pane.unhighlight_entry_for_node = function(node){
    $(pane.entries[node.fasta.id]).removeClass('selected')
  }

  pane.hide_entry_for_node = function(node){
    $(pane.entries[node.fasta.id]).hide()
  }

  pane.unhide_entry_for_node = function(node){
    $(pane.entries[node.fasta.id]).show()
  }

  pane.element_for_node = function(node){
    return $('.' + pane.entries[node.fasta.id])
  }

  pane.node_by_id = function(id){
    return pane.nodes[id]
  }

  pane.show_no_fasta()

  return pane
}

module.exports = FastaPane;
