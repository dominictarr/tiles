
function bounds (e) {
  return e.bounds || e
}

//even tiling



var grid = require('vec2-layout/grid')
exports.tile = function () {
  grid(this.tiles.map(bounds), this.root.bounds)
}

exports.tab = function () {
  if(!this.focused) return
  this.focused.raise()
  var center = this.tiles.indexOf(this.focused)
  var y = this.root.bounds.y
  var width = this.root.bounds.size.x
  var height = this.root.bounds.size.y
  this.tiles.map(bounds).forEach(function (e, i) {
    e.set(( i - center) * width, y)
    e.size.set(width, height)
  })

//  this.focused.bounds.set(this.root.bounds)
//  this.focused.bounds.size.set(this.root.bounds.size)
}

exports.cascade = function () {
  var l = this.tiles.length
  var n = l - 1
  var margin = 20
  var width = this.root.bounds.size.x - (margin * n)
  var height = this.root.bounds.size.y - (margin * n)
  var focused = this.focused
  this.tiles.forEach(function (win, i) {
    win.bounds.set(margin * i, margin * i)
    win.bounds.size.set(width, height)
    if(focused === win) win.raise()
  })
}
