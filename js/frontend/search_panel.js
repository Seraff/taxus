const BtnGroupRadio = require('../btn_group_radio.js')

class SearchPanel {
  constructor (panel, fangorn, fasta_pane) {
    this.$panel = panel
    this.$search_action_button = $('#find-action')
    this.$search_mode_buttons = $('#search-mode-btn-group')
    this.$search_field = $('#search-input')
    this.$search_result_field = $('#search-result-number')
    this.$select_all_button = $('#search-select-all')
    this.$tree_mode_button = $('#set-search-mode-to-tree')
    this.$fasta_mode_button = $('#set-search-mode-to-fasta')
    this.$case_sensitive_button = $('#case-sensitive-search')

    this.fangorn = fangorn
    this.fasta_pane = fasta_pane
    this.search_mode = 'tree'
    this.search_mode_radio = new BtnGroupRadio(this.$search_mode_buttons)
    this.found_items = []

    this.$search_action_button.on('click', () => {
      this.toggle()
    })

    $(window).on("keydown", (e) => {
      if (e.key == 'Escape'){
        this.hide()
      }
    })

    this.current_input_value = ''

    this.$search_field.on('keyup change', (e) => {
      if (this.current_input_value !== this.$search_field.val()) {
        this.current_input_value = this.$search_field.val()
        this.searchCurrent()
      }
    })

    this.$search_field.on('focus', (e) => {
      this.$search_result_field.addClass('focused')
    })

    this.$search_field.on('blur', (e) => {
      this.$search_result_field.removeClass('focused')
    })

    this.$search_result_field.on('click', (e) => {
      this.$search_field.focus()
    })

    document.addEventListener('new_tree_is_loaded', () => {
      this.cleanSearchField()
    })

    document.addEventListener('node_titles_changed', () => {
      if (!this.isHidden()) {
        this.searchCurrent()
      }
    })
    document.addEventListener('tree_topology_changed', () => {
      if (!this.isHidden()) {
        this.clean()
        this.searchCurrent()
      }
    })

    this.$select_all_button.on('click', () => {
      this.selectFoundItems()
      this.$select_all_button.blur()
    })

    this.search_mode_radio.on_change = () => {
      this.clean()
      this.search_mode = this.search_mode_radio.active_button.data('mode')
      this.searchCurrent()
    }

    this.$case_sensitive_button.on('click', () => {
      if (this.$case_sensitive_button.hasClass('btn-pressed')){
        this.$case_sensitive_button.removeClass('btn-pressed')
      } else {
        this.$case_sensitive_button.addClass('btn-pressed')
      }

      this.clean()
      this.searchCurrent()
    })
  }

  hide () {
    this.$panel.hide()
    this.$search_action_button.removeClass('btn-pressed')
    this.clean()
    this.refreshMetaInfo()
  }

  show () {
    this.$panel.show()
    this.$search_field.focus()
    this.$search_action_button.addClass('btn-pressed')
    this.searchCurrent()
  }

  toggle () {
    if (this.isHidden()) {
      this.show()
    } else {
      this.hide()
    }
  }

  isHidden () {
    return this.$panel.is(":hidden")
  }

  isTreeMode () {
    return this.search_mode === 'tree'
  }

  isCaseSensitive () {
    return this.$case_sensitive_button.hasClass('btn-pressed')
  }

  enableSelectAll () {
    this.$select_all_button.removeAttr('disabled')
  }

  disableSelectAll () {
    this.$select_all_button.attr('disabled', 'disabled')
  }

  searchCurrent () {
    this.search(this.current_input_value)
  }

  search (query) {
    this.clean()
    var case_sensitive = this.isCaseSensitive()

    if (query.length >= SearchPanel.QUERY_MIN_LEN) {

      if (!case_sensitive){
        query = query.toLocaleLowerCase()
      }

      if (this.isTreeMode()) {
        this.found_items = this.fangorn.get_leaves().filter((e) => {
          var str = case_sensitive ? e.name : e.name.toLocaleLowerCase()
          return str.includes(query)
        })
      } else {
        this.found_items = this.fasta_pane.entries.filter((e) => {
          var str = case_sensitive ? e.id : e.id.toLocaleLowerCase()
          return str.includes(query)
        })
      }

      this.found_items.forEach((e) => {
        if (this.isTreeMode()) {
          e.styler.highlight()
        } else {
          e.highlight()
        }
      })
    }

    this.refreshSelectFoundButton()
    this.refreshMetaInfo()
  }

  clean () {
    this.found_items.forEach((e) => {
      if (this.isTreeMode()) {
        e.styler.unhighlight()
      } else {
        e.unhighlight()
      }
    })

    this.found_items = []
  }

  cleanSearchField () {
    this.clean()
    this.$search_field.val('')
  }

  isAnythingFound () {
    return this.found_items.length > 0
  }

  selectFoundItems () {
    if (!this.isAnythingFound()) {
      return false
    }

    if (this.isTreeMode()){
      this.fangorn.select_specific(this.found_items)
    } else {
      this.fangorn.select_specific(this.found_items.map((i) => { return i.node }))
    }
  }

  refreshSelectFoundButton () {
    if (this.isAnythingFound()) {
      this.$select_all_button.removeAttr('disabled')
    } else {
      this.$select_all_button.attr('disabled', 'disabled')
    }
  }

  refreshMetaInfo () {
    if (this.isHidden()) {
      this.$search_result_field.val('')
      return true
    }

    if (this.$search_field.val().length >= SearchPanel.QUERY_MIN_LEN) {
      this.$search_result_field.val(this.found_items.length)
    } else {
      this.$search_result_field.val('')
    }
  }
}

SearchPanel.QUERY_MIN_LEN = 2

module.exports = SearchPanel
