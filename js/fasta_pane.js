const Path = window.modules.path

class FastaPane {
  constructor (taxus) {
    this.$fasta_pane = $('#fasta-panel')

    this.taxus = taxus
    this.fasta_is_loaded = false
    this.title = null

    this.entries = []
    this.entries_by_name = {}
    this.entries_by_alias = {}

    this.showNoFasta()

    document.addEventListener('fasta_clean_status_changed', (e) => {
      this.updateTitle()
    })

    document.addEventListener('new_fasta_applied', () => {
      this.render()
      this.fasta_is_loaded = true
    })

    document.addEventListener('fasta_closed', () => {
      this.fasta_is_loaded = false
      this.title = null
      this.showNoFasta()
    })

    document.addEventListener('selection_modified', () => {
      this.redrawEntries()
    })

    document.addEventListener('node_mark_status_changed', () => {
      this.redrawEntries()
    })

    document.addEventListener('node_titles_changed', () => {
      this.render()
    })

    $(document).on('click', '.fasta-pane-entry', (e) => {
      var alias = $(e.target).parent('.fasta-pane-entry').attr('id')
      var node = this.entries_by_alias[alias].node
      taxus.selectSpecific([node])
    })
  }

  render () {
    this.title = Path.basename(this.taxus.fasta_path)

    this.entries = []
    this.entries_by_name = {}
    this.entries_by_alias = {}

    this.$fasta_pane.html('')
    this.$fasta_pane.append('<b class="ui-text" id="fasta-title">' + this.title + '</b></br>')

    this.taxus.fastaMapping.eachMapping((m) => {
      var fasta = null

      // if fasta is loaded from node
      if (m.fasta === null && m.node !== null) {
        fasta = m.node.fasta() // take from node
      } else {
        fasta = m.fasta
      }

      var entry = new FastaPaneEntry(this, fasta)

      if (m.node === null) {
        entry.not_in_tree = true
      }

      entry.render()

      this.entries.push(entry)
      this.entries_by_name[entry.id] = entry
      this.entries_by_alias[entry.alias] = entry
    })

    this.fasta_is_loaded = true
  }

  showNoFasta() {
    this.$fasta_pane.html('<b class="ui-text">Fasta is not loaded...</b>')
  }

  redrawEntries() {
    this.entries.forEach((entry) => {
      entry.redraw()
    })
  }

  updateTitle() {
    if (this.fasta_is_loaded) {
      var title_el = document.getElementById('fasta-title')
      title_el.innerHTML = this.title

      if (this.taxus.fasta_is_dirty) {
        title_el.innerHTML += "*"
      }
    }
  }

  scrollTo(object = {}) {
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
  static HIGHLIGHT_COLOR = '#fff308'

  constructor(pane, fasta_entry) {
    this.$element = null

    this.$fasta_pane = pane.$fasta_pane
    this.fastaMapping = pane.taxus.fastaMapping
    this.fasta_entry = fasta_entry
    this.id = fasta_entry.id
    this.node = this.fastaMapping.getNodeForFasta(this.fasta_entry)

    this.alias = Math.random().toString(36).substring(2)
  }

  render() {
    if (!this.fasta_entry) {
      return ''
    }

    var klass = ''

    if (this.hasNode()) {
      klass += this.node.selected === true ? 'selected' : ''
    } else {
      klass += this.not_in_tree === true ? 'not-in-tree' : ''
    }

    var hidden = this.isHidden() ? 'hidden' : ''

    var content = '<span id="' + this.alias + '" ' + hidden + ' class="fasta-pane-entry ' + klass + '">'
    content += "<span class='fasta-pane-entry-header'>>" + this.fasta_entry.header + "</span><br>"
    content += "<span class='fasta-pane-entry-sequence'>" + this.fasta_entry.sequence + "</span><br>"
    content += "</span>"

    this.$fasta_pane.append(content)
    this.$element = $('span#' + this.alias)
  }

  redraw() {
    if (this.hasNode() && this.node.selected === true){
      this.select()
    } else {
      this.unselect()
    }

    if (this.hasNode() && this.node.isMarked() === true){
      this.hide()
    } else {
      this.unhide()
    }
  }

  select() {
    this.$element.addClass('selected')
  }

  unselect() {
    this.$element.removeClass('selected')
  }

  hide() {
    this.$element.hide()
  }

  unhide() {
    this.$element.show()
  }

  isHidden() {
    return this.hasNode() && this.node.isMarked()
  }

  hasNode() {
    return this.node !== null
  }

  highlight() {
    this.$element.css('background-color', FastaPaneEntry.HIGHLIGHT_COLOR)
  }

  unhighlight() {
    this.$element.css('background-color', '')

  }
}
