var Vec2 = require('vec2')

module.exports = function (vec, speed, fr) {
  speed = speed | 2000
  fr = (fr || 60) / 1000
  var _vec = new Vec2().set(vec.x, vec.y)
  console.log(_vec, vec)
  var _t = Date.now(), t = _t
  _vec.change(function () {
    if(_vec.animate) return //already animating
    _vec.animate = true
    var _t = Date.now(), t = _t
    var int = setInterval(function () {
      t = Date.now()
      var ts = (t - _t)/1000
      if(ts === 0) return
      var diff = _vec.subtract(vec, true)
      
      var length = diff.length()
      if(length < speed*ts) {
        _vec.animate = false
        clearInterval(int)
        return vec.set(_vec)
      }
      //move the target vector is that direction at fixed speed.
      vec.add(diff.normalize().multiply(Math.min(speed*ts, length)))
      _t = t
    }, fr)
  })
  return _vec
}
