const $ = require('jquery')
const Path = require('path')

class FastaPane {
  constructor (fangorn) {
    this.$fasta_pane = $('#fasta-panel')

    this.fangorn = fangorn
    this.fasta_is_loaded = false
    this.title = null

    this.entries = []
    this.entries_by_name = {}
    this.entries_by_alias = {}

    this.show_no_fasta()

    document.addEventListener('fasta_clean_status_changed', (e) => {
      this.update_title()
    })

    document.addEventListener('new_fasta_applied', () => {
      this.render()
    })

    document.addEventListener('node_titles_changed', () => {
      this.render()
    })

    document.addEventListener('fasta_closed', () => {
      this.fasta_is_loaded = false
      this.title = null
      this.show_no_fasta()
    })

    document.addEventListener('selection_modified', () => {
      this.redraw_entries()
    })

    document.addEventListener('node_mark_status_changed', () => {
      this.redraw_entries()
    })

    $(document).on('click', '.fasta-pane-entry', (e) => {
      var alias = $(e.target).parent('.fasta-pane-entry').attr('id')
      var node = this.entries_by_alias[alias].node
      fangorn.select_specific([node])
    })
  }

  render () {
    var nodes = fangorn.get_leaves()

    this.title = Path.basename(this.fangorn.fasta.path)

    this.entries = []
    this.entries_by_name = {}
    this.entries_by_alias = {}

    this.$fasta_pane.html('')
    this.$fasta_pane.append('<b class="ui-text" id="fasta-title">' + this.title + '</b></br>')

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
      var entry = new FastaPaneEntry(this.$fasta_pane, node)
      entry.render()

      this.entries.push(entry)
      this.entries_by_name[entry.id] = entry
      this.entries_by_alias[entry.alias] = entry
    })

    this.fasta_is_loaded = true
  }

  show_no_fasta () {
    this.$fasta_pane.html('<b class="ui-text">Fasta is not loaded...</b>')
  }

  redraw_entries () {
    this.entries.forEach((entry) => {
      entry.redraw()
    })
  }

  update_title () {
    if (this.fasta_is_loaded) {
      var title_el = document.getElementById('fasta-title')
      title_el.innerHTML = this.title
      if (this.fangorn.fasta_is_dirty) { title_el.innerHTML += "*" }
    }

  }

  scrollTo (object = {}) {
    var element = null

    if (object.name !== undefined) {
      element = this.entries_by_name[object.name]
    } else if (object.entry !== undefined) {
      element = object.entry
    }

    if (element == null || element == undefined) {
      return false
    }

    element.$element.get(0).scrollIntoView()
  }
}

class FastaPaneEntry {
  constructor (pane_el, node) {
    this.$element = null
    this.$fasta_pane = pane_el

    this.node = node
    this.id = node.fasta.id
    this.alias = Math.random().toString(36).substring(2)
  }

  render () {
    if (!this.node.fasta_is_loaded())
      return '';

    var klass = this.node.selected == true ? 'selected' : ''
    var hidden = this.isHidden() ? 'hidden' : ''

    var content = '<span id="' + this.alias + '" ' + hidden + ' class="fasta-pane-entry ' + klass + '">'
    content += "<span class='fasta-pane-entry-header'>>" + this.node.fasta.header + "</span><br>"
    content += "<span class='fasta-pane-entry-sequence'>" + this.node.fasta.sequence + "</span><br>"
    content += "</span>"

    this.$fasta_pane.append(content)
    this.$element = $("span#"+this.alias)
  }

  redraw () {
    if (this.node.selected == true){
      this.select()
    } else {
      this.unselect()
    }

    if (this.node.is_marked() == true){
      this.hide()
    } else {
      this.unhide()
    }
  }

  select () {
    this.$element.addClass('selected')
  }

  unselect () {
    this.$element.removeClass('selected')
  }

  hide () {
    this.$element.hide()
  }

  unhide () {
    this.$element.show()
  }

  isHidden () {
    return this.node.is_marked()
  }

  highlight () {
    this.$element.css('background-color', FastaPaneEntry.HIGHLIGHT_COLOR)
  }

  unhighlight () {
    this.$element.css('background-color', '')

  }
}

FastaPaneEntry.HIGHLIGHT_COLOR = '#fff308'

module.exports = FastaPane;
