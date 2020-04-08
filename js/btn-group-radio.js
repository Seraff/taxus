class BtnGroupRadio {
  constructor (element) {
    if (element.jquery){
      this.element = element.get(0)
    } else {
      this.element = element
    }

    this.buttons = $(this.element).find('.btn')
    this.active_button = $(this.element).find('.btn.active')

    this.on_change = undefined

    this.buttons.each((id, button) => {
      $(button).on('click', (e) => {
        if (button !== this.active_button.get(0)) {
          this.active_button.removeClass('active')
          this.active_button = $(button)
          this.active_button.addClass('active')

          if (this.on_change !== undefined) {
            this.on_change(button)
          }
        }
      })
    })
  }
}

module.exports = BtnGroupRadio
