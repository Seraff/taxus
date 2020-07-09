class GeometryHelper {
  static rect(x, y, w, h) { return "M"+[x,y]+" l"+[w,0]+" l"+[0,h]+" l"+[-w,0]+"z"; }

  static valueInRange(value, min, max){ return (value >= min) && (value <= max); }

  static rectsOverlap(A, B){
    var xOverlap = GeometryHelper.valueInRange(A.x, B.x, B.x + B.width) || GeometryHelper.valueInRange(B.x, A.x, A.x + A.width);
    var yOverlap = GeometryHelper.valueInRange(A.y, B.y, B.y + B.height) || GeometryHelper.valueInRange(B.y, A.y, A.y + A.height);

    return xOverlap && yOverlap;
  }

  static makeAbsoluteContext (element) {
    return function(x,y) {
      var matrix = element.getCTM();
      return {
        x: (matrix.a * x) + (matrix.c * y) + matrix.e,
        y: (matrix.b * x) + (matrix.d * y) + matrix.f
      };
    };
  }

  static screenToGlobal(current_transform, bbox) {
    var bbox_glob = {}
    bbox_glob.x = (bbox.x - current_transform.translate[0]) / current_transform.scale[0]
    bbox_glob.y = (bbox.y - current_transform.translate[1]) / current_transform.scale[1]
    bbox_glob.width = bbox.width / current_transform.scale[0]
    bbox_glob.height = bbox.height / current_transform.scale[1]
    return bbox_glob
  }
}

module.exports = GeometryHelper
