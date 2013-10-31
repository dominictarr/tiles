
var grid = require('vec2-layout/grid')

module.exports = Layout
function each(obj, iter) {
  for(var k in obj)
    iter(obj[k], k, obj)
}

function remove (array, item) {
  var i = array.indexOf(item)
  console.log(array.map(function (e) { return e.id}), i)
  if(~i) array.splice(i, 1)
  console.log(array, '-')
}

function find (ary, test) {
  for(var i in ary)
    if(test(ary[i], i, ary))
      return ary[i]
}

function swap (ary, a, b) {
  var i = ary.indexOf(a)
  var j = ary.indexOf(b)
  //if the window is the first or last, do not swap,
  //instead shift/pop so that overall order is preserved.

  if(i === 0 && j === ary.length - 1) {
    ary.push(ary.shift())
  }
  else if(j === 0 && i === ary.length - 1) {
    ary.unshift(ary.pop())
  }
  else {
    ary[i] = b
    ary[j] = a
  }
  return ary
}


function relative(ary, item, dir) {
  var i = ary.indexOf(item)
  if(~i) {
    i = i + dir
    if(i < 0)
      i = ary.length + i
    if(i >= ary.length)
      i = i - ary.length
    var w = ary[i]
    return w
  }
}


function Layout (root) {
  this.root = root
  this.all = {}
  this.tiles = []
  this.focused
  this.tiling = true
  this.delay = 100
}

var l = Layout.prototype

l.add = function (win) {
    console.log('add', win)
    var self = this
    this.all[win.id] = win
    if(win.bounds && win.attrs && !win.attrs.overrideRedirect) {
      this.tiles.push(win)
      if(!this.focused) this.focused = win
      win.on('MouseOver', function () {
      
        if(self._delay > Date.now()) return
        console.log('focused!', win.id)
        self.focused = win
        win.focus()
      })
    }
  return this
}

l.remove = function (win) {
  console.log('remove', win.id)
  if(!win)
    win = this.focused
  delete this.all[win.id]
  if(win === this.focused) {
    this.focused = relative(this.tiles, win, -1)
    
    if(this.focused) this.focused.focus()
  }
  remove(this.tiles, win)
   //if(!this.focused)
  //  this.focused = this.tiles[0]
  this.layout()
}

l.cycle = function (dir) { //1 or -1
  var f = relative(this.tiles, this.focused, dir || 1)
  if(f) this.focused = f.focus()
  this.layout()
  return this
}

l.move = function (dir) { //1 or -1
  this._delay = Date.now() + this.delay
  if(!this.focused) this.focused = this.tiles[0].focus()
  var _focused = relative(this.tiles, this.focused, dir)
  swap(this.tiles, this.focused, _focused)
  //    focused = _focused.focus()
  this.layout()

  return this
}

l.layout = function () {
    if(this.tiling)
      grid(this.tiles.map(function (e) {return e.bounds}), this.root.bounds)
    else if(this.focused) {
      this.focused.raise()
      this.focused.bounds.set(this.root.bounds)
      this.focused.bounds.size.set(this.root.bounds.size)
    }
}

l.toggle = function () {
  this.tiling = !this.tiling
  this._delay = Date.now() + this.delay
  this.layout()
  return this
}

//hide all windows.
l.hide = function () {}
//show all windows
l.show = function () {}

