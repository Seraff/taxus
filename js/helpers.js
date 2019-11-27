const path = require('path')

function makeAbsoluteContext(element) {
  return function(x,y) {
    var matrix = element.getCTM();
    return {
      x: (matrix.a * x) + (matrix.c * y) + matrix.e,
      y: (matrix.b * x) + (matrix.d * y) + matrix.f
    };
  };
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function fangorize_path(pth){
  var parsed = path.parse(pth)
  return parsed.dir + path.sep + parsed.name + ".fangorn" + parsed.ext
}

function path_is_fangorized(pth){
  return path.parse(pth).name.match(/\.fangorn$/) != null
}
