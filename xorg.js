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
    UnmapWindow:    'unmap',
    ChangeWindowAttributes: 'set',
    QueryTree: 'tree',
    GetWindowAttributes: 'get',
    GetGeometry: 'getBounds',
  }

  each(methods, function (_name, name) {
    w[_name] = function () {
      var args = [].slice.call(arguments)
      args.unshift(this.id)
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

  var kb = {}

  w.onKey = function (mod, key, listener) {
    kb[mod.toString('16') + '-' + key.toString(16)] = listener
    //window, parentWindow?, modifier, key, ?, async (0 = blocking)
    X.GrabKey(this.id, 0, mod, key, 0, 1)
    return this
  }

  w.offKey = function (mod, key) {
    X.GrabKey(this.id, 0, mod, key)
    return this
  }

  w.focus = function (revert) {
    X.SetInputFocus(this.id, revert || 1)
    this.emit('focus')
    return this
  }

  w.kill = function () {
    X.KillKlient(this.id)
    return this
  }

  w.close = function () {
    X.DestroyWindow(this.id)
    return this
  }

  w.raise = function () {
    X.RaiseWindow(this.id)
    return this
  }

  function createWindow (wid) {
    if(wid != null && 'number' != typeof wid)
      throw new Error('must be number, was:' + wid)
    if(all[wid]) return all[wid]
    if(null == wid) {
      //FIX THIS
      throw new Error("unknown window "+ wid)
      //wid = X.AllocID()
      //X.CreateWindow(wid)
    }
    return all[wid] = new Window(wid)
  }
  var _ev
  X = x11.createClient(function (err, display) {
    if(err) return cb(err)
    var rid = display.screen[0].root
    var root = createWindow(+rid).load(function (_err) {
      display.root = root
      cb(err, display, display)
    })
    display.createWindow = createWindow

    X.on('event', function (ev) {

      //BUG IN x11? events are triggered twice!
      if(_ev === ev) return
      _ev = ev

      var wid = (ev.wid1 || ev.wid), win

      if(wid)
        win = createWindow(wid)
      if(ev.name === 'KeyPress' || ev.name === 'KeyRelease') {
        var listener = kb[ev.buttons.toString(16) + '-' + ev.keycode.toString(16)]
        ev.down = ev.name === 'KeyPress'
        ev.up = !ev.down
        if(listener) listener(ev)
      }

      if(ev.name === 'DestroyNotify') {
        delete all[ev.wid1]
      }

      if(!root)
        throw new Error('no root')

      if(ev.name === 'EnterWindow')
        ev.name = 'MouseOver'

      if(win) {
        win.emit(ev.name, ev)
      }
      root.emit(ev.name, ev, win)
    })

  }).on('error', function (err) {
    console.error(err.stack)
  })
}
