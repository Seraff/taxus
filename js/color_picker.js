const AColorPicker = require('a-color-picker');

function ColorPicker(picker_selector, action_selector, colored_selectors = []){
  picker = this;
  picker.color_change_callbacks = [];

  picker.a_color_picker = AColorPicker.createPicker(picker_selector, {showRGB: false, showHSL: false});
  picker.a_color_picker.hide();

  $(action_selector).on("click", function () {
    picker.a_color_picker.toggle();
  });

  $(window).on("mousedown", function(e){
    if (picker.is_shown())
      picker.saveAndHide();
  });

  $(".a-color-picker").on("mousedown", function(e){
    e.stopPropagation();
  });

  $(action_selector).on("mousedown", function(e){
    e.stopPropagation();
  });

  colored_selectors.forEach(function(s){
    picker.a_color_picker.on("change", function(p, color){
      $(s).css({ background: AColorPicker.parseColor(color, "hex")});
    });
  });

  picker.saveAndHide = function(){
    var current_pal = picker.a_color_picker.palette;

    if (current_pal.length >= 10)
      current_pal.pop();

    current_pal.unshift(picker.a_color_picker.color);
    picker.a_color_picker.palette = current_pal;

    picker.a_color_picker.hide();

    picker.color_change_callbacks.forEach(function(c){
      c(picker.a_color_picker.color);
    });
  }

  picker.is_shown = function(){
    return !picker.a_color_picker.element.classList.contains("hidden");
  }

  picker.set_color = function(color = null){
    picker.a_color_picker.color = color;
  }

  picker.add_color_change_callback = function(callback){
    picker.color_change_callbacks.push(callback);
  }
}


module.exports = ColorPicker;
