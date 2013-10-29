var x11 = require('x11')
var X
var Rec2 = require('rec2')
var grid = require('vec2-layout/grid')
var windows = []
var all = {}
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

  grid(lay, root.bounds)
}

require('./xorg')(function (err, client, display) {
  if(err) throw err
  console.log(client)

  var rw = client.root
  //create a new window, but don't add it to the tree.

  var EV = x11.eventMask.Exposure | x11.eventMask.SubstructureRedirect
      | x11.eventMask.MapRequest | x11.eventMask.SubstructureNotify

  rw.set({eventMask: EV}, function(err) {
    if (err && err.error == 10) {
        console.error('Error: another window manager already running.');
        process.exit(1);
    }
  })

//    rw.children(function (err, children) {
//      console.log('Layout')
//      layout()
//    })

//  rw.on('MapRequest', function (ev, win) {
//    console.log('MapRequest', win)
//    //load the window's properties, and then lay it out.
//    win.load(layout)
//  })
//  rw.on('DestroyRequest', function (ev, win) {
//    console.log('DestroyRequest', win)
//    layout()
//  })

})
//.on('event', function (ev) {
//  if (ev.name === 'MapRequest') {
//    windows.push(ev.wid)
//    //track the new window...
//    var w = createWindow(ev.wid).load(function (err) {
//      layout ()
//      w.map()
//    })
//    
//    return;
//  } else if (ev.name === 'ConfigureRequest') { // ConfigureRequest
//     X.ResizeWindow(ev.wid, ev.width, ev.height);
//  } else if(ev.name === 'DestroyNotify') {
//    delete all[ev.wid1]
//    layout()
//  }
// })
