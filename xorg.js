//I want to make this into a convienent api for working with X.
//my aim to be to make it browserify where possible,
//so that your expectations from web development apply.

var x11 = require('x11')
var Rec2 = require('rec2')

module.exports = function (cb) {
  var X
  var all = {}

  function each(obj, iter) {
    for(var k in obj)
      iter(obj[k], k, obj)
  }

  function createWindow (wid) {
    if(all[wid]) return all[wid]
    if(null == wid) {
      throw new Error('create window!')
      wid = X.AllocID()
      X.createWindow(wid)
    }
    return all[wid] = new Window(wid)
  }

  var util = require('util')
  var EventEmitter = require('events').EventEmitter
  util.inherits(Window, EventEmitter)

  function Window (wid, opts) {
    if(wid == null) {
      this.id = X.AllocID()
      X.CreateWindow(this.id, opts)
    }
    this.event
    this.id = wid
    X.event_consumers[wid] = X
  }

  var w = Window.prototype
  var methods = {
    MoveWindow:   'move',
    ResizeWindow: 'resize',
    MapWindow:    'map',
    ChangeWindowAttributes: 'set',
    QueryTree: 'tree',
    GetWindowAttributes: 'get',
    GetGeometry: 'getBounds'
  }

  each(methods, function (_name, name) {
    w[_name] = function () {
      var args = [].slice.call(arguments)
      args.unshift(this.id)
      console.log(name, args)
      return X[name].apply(X, args)
    }
  })

  w.load = function (cb) {
    var self = this

    this.get(function (err, attrs) {
      self.attrs = attrs
      if(self.attrs && self.bounds) cb()
    })

    this.getBounds(function (err, bounds) {
      //self.bounds = bounds
      self.bounds = new Rec2(bounds.posX, bounds.posY, bounds.width, bounds.height)
      self.bounds.change(function () {
        self.move(self.bounds.x, self.bounds.y)
      })
      self.bounds.size.change(function () {
        self.resize(self.bounds.size.x, self.bounds.size.y)
      })
      if(self.attrs && self.bounds) cb()
    })
    return this
  }

  w.children = function (cb) {
    var self = this
    self._children = []
    this.tree(function (err, tree) {
      var n = tree.children.length
      console.log(tree)

      if(n === 0)
        return n = 1, next()

      tree.children.forEach(function (wid) {
        var w = createWindow(wid).load(function (err) {
          if(err) next(err)
          self._children.push(w)
          next()
        })
      });
      
      function next (err) {
        if(err) return n = -1, cb(err)
        if(--n) return
        cb(null, self._children)
      }

    })
    return this
  }


  function createWindow (wid) {
    if(wid != null && 'number' != typeof wid)
      throw new Error('must be number, was:' + wid)
    if(all[wid]) return all[wid]
    if(null == wid) {
      throw new Error('CREATE WINDOW', wid)
      wid = X.AllocID()
      X.CreateWindow(wid)
    }
    return all[wid] = new Window(wid)
  }

  X = x11.createClient(function (err, display) {
    if(err) return cb(err)
//    var client = display
    var rid = display.screen[0].root
    var root = createWindow(+rid).load(function (_err) {
      display.root = root
      console.log('ROOT')
      cb(err, display, display)
    })
    X.on('event', function (ev) {
      console.log('event', ev.name)
      console.log(ev)
      var wid = (ev.wid1 || ev.wid), win

      if(wid)
        win = createWindow(wid)

      if(ev.name === 'DestroyNotify') {
        delete all[ev.wid1]
      }
      if(!root)
        throw new Error('no root')
      root.emit(ev.name, ev, win)
    })

  })
}
