const Path = require('path')

function FastaPane(){
  var pane = this

  pane.fasta_is_loaded = false
  pane.title = null
  pane.entries = {}

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

      var current_content = pane.content_for_node(node)

      content += current_content
    })

    content = '<b class="ui-text">' + pane.title + '</b></br>' + content
    $('#fasta-panel').html(content)

    pane.fasta_is_loaded = true
  }

  pane.content_for_node = function(node){
    if (!node.fasta_is_loaded())
      return '';

    var rnd = Math.random().toString(36).substring(7);
    klass = node.selected == true ? 'fasta-node-selected' : '';
    hidden = node.is_marked() ? 'hidden' : '';
    content = '<span id="' + rnd + '" ' + hidden + ' class="' + klass + '">';
    content += "<b>>" + node.fasta.original_title + "</b><br>";
    content += node.fasta.sequence + "<br></span>";

    pane.entries[node.fasta.id] = "span#"+rnd

    return content;
  }

  pane.show_no_fasta = function(){
    $('#fasta-panel').html('<b class="ui-text">Fasta is not loaded...</b>')
  }

  pane.select_entry_by_node = function(node){
    return $(pane.entries[node.fasta.id])
  }

  pane.highlight_entry_for_node = function(node){
    $(pane.entries[node.fasta.id]).addClass('fasta-node-selected')
  }

  pane.unhighlight_entry_for_node = function(node){
    $(pane.entries[node.fasta.id]).removeClass('fasta-node-selected')
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

  pane.show_no_fasta()

  return pane
}

module.exports = FastaPane;
