class SearchPanel {
  constructor (panel, taxus, fasta_pane) {
    this.$panel = panel
    this.$search_action_button = $('#find-action')
    this.$search_mode_buttons = $('#search-mode-btn-group')
    this.$search_field = $('#search-input')
    this.$search_result_field = $('#search-result-number')
    this.$select_all_button = $('#search-select-all')
    this.$tree_mode_button = $('#set-search-mode-to-tree')
    this.$fasta_mode_button = $('#set-search-mode-to-fasta')
    this.$case_sensitive_button = $('#case-sensitive-search')
    this.$search_nav_buttons = $('.search-nav-button')

    this.taxus = taxus
    this.fasta_pane = fasta_pane
    this.search_mode = 'tree'
    this.search_mode_radio = new BtnGroupRadio(this.$search_mode_buttons)
    this.found_items = []
    this.current_nav_item_index = null

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

    this.$search_nav_buttons.on('click', (e) => {
      var direction = $(e.currentTarget).data('direction')

      if (['up', 'down'].includes(direction)){
        this.navigate(direction)
      }
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
        this.found_items = this.taxus.get_leaves().filter((e) => {
          var str = case_sensitive ? e.name : e.name.toLocaleLowerCase()
          return str.includes(query)
        })
      } else {
        this.found_items = this.fasta_pane.entries.filter((e) => {
          if (e.isHidden()) {
            return false
          }

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
    this.refreshNavButtons()
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
    this.current_nav_item_index = null
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
      this.taxus.select_specific(this.found_items)
    } else {
      this.taxus.select_specific(this.found_items.map((i) => { return i.node }))
    }
  }

  navigate (direction) {
    if (!this.isAnythingFound() || !['up', 'down'].includes(direction)) {
      return false
    }

    if (this.current_nav_item_index == null) {
      if (direction == 'up') {
        this.current_nav_item_index = this.found_items.length - 1
      } else if (direction == 'down') {
        this.current_nav_item_index = 0
      }
    } else {
      if (direction == 'up') {
        this.current_nav_item_index -= 1
      } else if (direction == 'down') {
        this.current_nav_item_index += 1
      }
    }

    if (this.current_nav_item_index < 0) {
      this.current_nav_item_index = this.found_items.length - 1
    } else if (this.current_nav_item_index > this.found_items.length - 1) {
      this.current_nav_item_index = 0
    }

    var node = this.found_items[this.current_nav_item_index]

    if (this.isTreeMode()) {
      this.taxus.get_tree().moveToNode(node)
    } else {
      this.fasta_pane.scrollTo({ entry: node })
    }

  }

  refreshSelectFoundButton () {
    if (this.isAnythingFound()) {
      this.$select_all_button.removeAttr('disabled')
    } else {
      this.$select_all_button.attr('disabled', 'disabled')
    }
  }

  refreshNavButtons () {
    if (this.isAnythingFound()) {
      this.$search_nav_buttons.removeAttr('disabled')
    } else {
      this.$search_nav_buttons.attr('disabled', 'disabled')
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
