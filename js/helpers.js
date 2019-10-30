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
