const BtnGroupRadio = require('../btn_group_radio.js')

class SearchPanel {
  constructor (panel, fangorn) {
    this.$panel = panel
    this.$search_mode_buttons = $('#search-mode-btn-group')
    this.$search_field = $('#search-input')
    this.$select_all_button = $('#search-select-all')

    this.fangorn = fangorn
    this.search_mode_radio = new BtnGroupRadio(this.$search_mode_buttons)

    $(window).on("keyup", (e) => {
      if (e.key == 'Escape'){
        this.hide()
      }
    })

    this.current_input_value = ''

    this.$search_field.on('keyup change', (e) => {
      if (this.current_input_value !== this.$search_field.val()) {
        this.current_input_value = this.$search_field.val()
        this.search(this.current_input_value)
      }
    })
  }

  hide () {
    this.$panel.hide()
  }

  toggle () {
    this.$panel.toggle()
  }

  searchMode () {
    return this.search_mode_radio.active_button.data('mode')
  }

  isTreeMode () {
    return this.searchMode() == 'tree'
  }

  enableSelectAll () {
    this.$select_all_button.removeAttr('disabled')
  }

  disableSelectAll () {
    this.$select_all_button.attr('disabled', 'disabled')
  }

  search (query) {
    if (query.length < SearchPanel.QUERY_MIN_LEN) {
      this.clean()
      return false
    }

    console.log('query: "' + query + '" with mode "' + this.searchMode() + '"')
  }

  clean () {
    console.log('clean')
  }
}

SearchPanel.QUERY_MIN_LEN = 3
SearchPanel.HIGHLIGHT_COLOR = '#fff308'

module.exports = SearchPanel
