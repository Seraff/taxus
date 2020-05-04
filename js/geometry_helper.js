class GeometryHelper {
  static rect(x, y, w, h) { return "M"+[x,y]+" l"+[w,0]+" l"+[0,h]+" l"+[-w,0]+"z"; }

  static valueInRange(value, min, max){ return (value >= min) && (value <= max); }

  static rectsOverlap(A, B){
    var xOverlap = GeometryHelper.valueInRange(A.x, B.x, B.x + B.width) || GeometryHelper.valueInRange(B.x, A.x, A.x + A.width);
    var yOverlap = GeometryHelper.valueInRange(A.y, B.y, B.y + B.height) || GeometryHelper.valueInRange(B.y, A.y, A.y + A.height);

    return xOverlap && yOverlap;
  }
}

module.exports = GeometryHelper
