const $ = require('jquery')
const Path = require('path')

class FastaPane {
  constructor (fangorn) {
    this.$fasta_panel = $('#fasta-panel')

    this.fangorn = fangorn
    this.fasta_is_loaded = false
    this.title = null
    this.entries = {}
    this.nodes = {}

    this.show_no_fasta()

    document.addEventListener('fasta_clean_status_changed', (e) => {
      this.update_title()
    })

    $(document).on('click', '.fasta-pane-entry', (e) => {
      var id = $(e.target).parent('.fasta-pane-entry').attr('id')
      var node = this.node_by_id(id)
      fangorn.select_specific([node])
    })

    document.addEventListener('new_fasta_applied', () => {
      this.redraw()
    })

    document.addEventListener('node_titles_changed', () => {
      this.redraw()
    })

    document.addEventListener('fasta_closed', () => {
      this.show_no_fasta()
    })
  }

  redraw () {
    this.set_title_from_path(this.fangorn.fasta.path)
    this.render()
  }

  set_title_from_path (path) {
    this.title = Path.basename(path)
  }

  render () {
    var nodes = fangorn.get_leaves()

    this.entries = {}
    this.$fasta_panel.html('')
    this.$fasta_panel.append('<b class="ui-text" id="fasta-title">' + this.title + '</b></br>')

    var content = ''

    if (nodes.length === 0){
      this.show_no_fasta()
      return true
    }

    nodes.forEach((node) => {
      if (!node.fasta_is_loaded()){
        this.fasta_is_loaded = false
        this.show_no_fasta()
        return true
      }
      var alias = Math.random().toString(36).substring(2)
      var current_content = this.contentForNode(node, alias)

      this.$fasta_panel.append(current_content)

      var entry = { element: $("span#"+alias), node: node }

      this.entries[node.fasta.id] = entry
      this.nodes[alias] = entry
    })

    this.fasta_is_loaded = true
  }

  contentForNode (node, alias) {
    if (!node.fasta_is_loaded())
      return '';

    var klass = node.selected == true ? 'selected' : ''
    var hidden = node.is_marked() ? 'hidden' : ''

    var content = '<span id="' + alias + '" ' + hidden + ' class="fasta-pane-entry ' + klass + '">'
    content += "<span class='fasta-pane-entry-header'>>" + node.fasta.header + "</span><br>"
    content += "<span class='fasta-pane-entry-sequence'>" + node.fasta.sequence + "</span><br>"
    content += "</span>"

    return content;
  }

  show_no_fasta () {
    this.$fasta_panel.html('<b class="ui-text">Fasta is not loaded...</b>')
  }

  select_entry_by_node (node) {
    return this.entries[node.fasta.id].element
  }

  highlight_entry_for_node (node) {
    this.entries[node.fasta.id].element.addClass('selected')
  }

  unhighlight_entry_for_node (node) {
    this.entries[node.fasta.id].element.removeClass('selected')
  }

  hide_entry_for_node (node) {
    this.entries[node.fasta.id].element.hide()
  }

  unhide_entry_for_node (node) {
    this.entries[node.fasta.id].element.show()
  }

  node_by_id (id) {
    return this.nodes[id].node
  }

  update_title () {
    if (this.fasta_is_loaded) {
      var title_el = document.getElementById('fasta-title')
      title_el.innerHTML = this.title
      if (this.fangorn.fasta_is_dirty) { title_el.innerHTML += "*" }
    }

  }
}

module.exports = FastaPane;
