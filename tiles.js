var x11 = require('x11')
var X

var windows = []

var events =
    x11.eventMask.Button1Motion
  | x11.eventMask.ButtonPress
  | x11.eventMask.ButtonRelease
  | x11.eventMask.SubstructureNotify
  | x11.eventMask.SubstructureRedirect
  | x11.eventMask.Exposure;

function layout () {
  var width = 640 / windows.length
  windows.forEach(function (wid, i) {
    X.MoveWindow(wid, i * width, 0)
    X.ResizeWindow(wid, width, 480)
  })
}

var util = require('util')
var EventEmitter = require('events').EventEmitter
util.inherits(Window, EventEmitter)

function Window (wid, opts) {
  if(windows[wid]) return windows[wid]
  if(wid == null) {
    this.id = X.AllocID()
    X.CreateWindow(wid, opts)
  }
  this.event
  this.id = wid
  windows[this.id] = this
}

var w = Window.prototype
var methods = {
  MoveWindow:   'move',
  ResizeWindow: 'resize',
  MapWindow:    'map',
  ChangeWindowAttributes: 'set',
  QueryTree: 'tree'
}

for(var name in methods) {
  var _name = methods[name]
  w[_name] = function () {
    var args = [].slice.call(arguments)
    args.unshift(this.id)
    return X[name].apply(X, args)
  }
}

function manage (wid) {
  if(!~windows.indexOf(wid)) {
    windows.push(wid)
    X.event_consumers[wid] = X11
  }
  X.MapWindow(wid)
}

var X11 = x11.createClient(function (err, display) {
  var root = display.screen[0].root
  var client = X = display.client
//  console.log(X)

  var EV = x11.eventMask.Exposure | x11.eventMask.SubstructureRedirect
      | x11.eventMask.MapRequest | x11.eventMask.SubstructureNotify

  console.log(EV.toString(2), x11.eventMask)


  X.ChangeWindowAttributes(root, { 
    eventMask: 
        EV
    }, function(err) {
      if (err.error == 10) {
          console.error('Error: another window manager already running.');
          process.exit(1);
      }
  });
  X.QueryTree(root, function(err, tree) {
      tree.children.forEach(manage);
      layout()
  });

//  X.

}).on('event', function (ev) {

  if (ev.name === 'MapRequest') {
    windows.push(ev.wid)
    layout ()
    X.MapWindow(ev.wid)
    
    return;
  } else if (ev.name === 'ConfigureRequest') { // ConfigureRequest
    X.ResizeWindow(ev.wid, ev.width, ev.height);
  } else if (ev.name === 'Expose') {
    console.log('EXPOSE', ev);
  } else if(ev.name === 'DestroyNotify') {
    console.log('DESTROY', ev)
    var i = windows.indexOf(ev.wid)
    windows.splice(i, 1)
    layout()
  } else {
    console.log("OTHER", ev)
  }
})
