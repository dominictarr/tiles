var x11 = require('x11')
var X
var Rec2 = require('rec2')
var grid = require('vec2-layout/grid')
var windows = []
var root

var events =
    x11.eventMask.Button1Motion
  | x11.eventMask.ButtonPress
  | x11.eventMask.ButtonRelease
  | x11.eventMask.SubstructureNotify
  | x11.eventMask.SubstructureRedirect
  | x11.eventMask.Exposure;
  
function each(obj, iter) {
  for(var k in obj)
    iter(obj[k], k, obj)
}


require('./xorg')(function (err, client, display) {
  if(err) throw err
//  console.log(client)
  var all = {}
  var rw = client.root

  var focused = null

  function layout () {
    var width = 640 / Object.keys(all).length
    var i = 0
    var lay = []
    //I'm not sure what overrideRedirect is yet
    //but browsers create them...

    each(all, function (win) {
      if((!win.attrs || !win.attrs.overrideRedirect) && win.bounds) {
        lay.push(win.bounds)
      }
    })
    grid(lay, rw.bounds)
  }

  //create a new window, but don't add it to the tree.

  var EV = x11.eventMask.Exposure | x11.eventMask.SubstructureRedirect
      | x11.eventMask.MapRequest | x11.eventMask.SubstructureNotify
      | x11.eventMask.EnterWindow

  rw.set({eventMask: EV}, function(err) {
    if (err && err.error == 10) {
        console.error('Error: another window manager already running.');
        process.exit(1);
    }
  })

  rw.children(function (err, children) {
    children.forEach(function (win) {
      all[win.id] = win
      win.on('MouseOver', function () {
        console.log('focused!', win.id)
        focused = win
        win.focus()
      })
    })
    layout()
  })

  rw.on('MapRequest', function (ev, win) {
    console.log('MapRequest', win)
    //load the window's properties, and then lay it out.
    win.load(function () {
      all[win.id] = win
      win.map()
      win.on('MouseOver', function () {
        console.log('focused!', win.id)
        focused = win
        win.focus()
      })
      layout()
    })

    win.set({eventMask: x11.eventMask.EnterWindow}, console.log)
  })

  rw.on('DestroyNotify', function (ev, win) {
    console.log('DestroyNotify', win)
    delete all[win.id]
    layout()
  })

  rw.on('ConfigureRequest', function (ev, win) {
    if(win.bounds)
      win.bounds.size.set(ev.width, ev.height)
    else
      win.resize(ev.width, ev.height)
  })

  var spawn = require('child_process').spawn

  rw.on('MouseOver', console.log)

  //open terminal
  rw.onKey(0x40, 45, function (ev) {
    if(ev.down)
      spawn(process.env.TERM || 'xterm')
  })  
  rw.onKey(0x40, 31, function (ev) {
    if(ev.down)
      spawn(process.env.BROWSER || 'chromium')
  })  
  rw.onKey(0x40, 9, function (ev) {
    if(ev.down) {
      console.log('quiting...')
      process.exit(0)
    }
  })
  function close (ev) {
    if(ev.down && focused) {
      var _focused = focused
      focused = null
      _focused.close()
    }
  }

  rw.onKey(0x40, 53, close) //command-Q
  rw.onKey(0x40, 59, close) //command-W

})

