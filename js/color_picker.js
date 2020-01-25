const $ = require('jquery')
const AColorPicker = require('a-color-picker')

function ColorPicker (pickerSelector, actionSelector, coloredSelectors = []) {
  var picker = this
  picker.color_change_callbacks = []

  picker.a_color_picker = AColorPicker.createPicker(pickerSelector, { showRGB: false, showHSL: false })
  picker.a_color_picker.hide()

  $(actionSelector).on('click', function () {
    picker.a_color_picker.toggle()
  })

  $(window).on('mousedown', function (e) {
    if (picker.is_shown()) { picker.saveAndHide() }
  })

  $('.a-color-picker').on('mousedown', function (e) {
    e.stopPropagation()
  })

  $(actionSelector).on('mousedown', function (e) {
    e.stopPropagation()
  })

  coloredSelectors.forEach(function (s) {
    picker.a_color_picker.on('change', function (p, color) {
      $(s).css({ background: AColorPicker.parseColor(color, 'hex') })
    })
  })

  picker.saveAndHide = function () {
    var currentPal = picker.a_color_picker.palette

    if (currentPal.length >= 10) { currentPal.pop() }

    currentPal.unshift(picker.a_color_picker.color)
    picker.a_color_picker.palette = currentPal

    picker.a_color_picker.hide()

    picker.color_change_callbacks.forEach(function (c) {
      c(picker.a_color_picker.color)
    })
  }

  picker.is_shown = function () {
    return !picker.a_color_picker.element.classList.contains('hidden')
  }

  picker.set_color = function (color = null) {
    picker.a_color_picker.color = color
  }

  picker.remove_color = function () {
    picker.a_color_picker.color = null
    coloredSelectors.forEach(function (s) {
      $(s).css({ background: "" })
      $(s).addClass('no-color')
    })
  }

  picker.add_color_change_callback = function (callback) {
    picker.color_change_callbacks.push(callback)
  }
}

module.exports = ColorPicker
