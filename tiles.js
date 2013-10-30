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

function remove (array, item) {
  var i = array.indexOf(item)
  if(~i) array.splice(i, 1)
}

require('./xorg')(function (err, client, display) {
  if(err) throw err

  var tiles = []
  var all = {}
  var rw = client.root

  var focused = null
  var tiling = true

  function layout () {
    var width = 640 / Object.keys(all).length
    var i = 0
    var lay = []
    //I'm not sure what overrideRedirect is yet
    //but browsers create them...

    grid(tiles.map(function (e) {return e.bounds}), rw.bounds)
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

  function manage (win) {
    console.log('manage', win)
    all[win.id] = win
    if(win.bounds && win.attrs && !win.attrs.overrideRedirect) {
      tiles.push(win)
      if(!focused) focused = win
      win.on('MouseOver', function () {
        return
        console.log('focused!', win.id)
        focused = win
        win.focus()
      })
    }
  }

  rw.children(function (err, children) {
    children.forEach(manage)
    layout()
  })

  rw.on('MapRequest', function (ev, win) {
    //load the window's properties, and then lay it out.
    win.load(function () {
      manage(win)
      win.map()
      layout()
    })

    win.set({eventMask: x11.eventMask.EnterWindow}, console.log)
  })

  rw.on('DestroyNotify', function (ev, win) {
    console.log('DestroyNotify', win)
    delete all[win.id]
    remove(tiles, win)
    if(win === focused)
      focused = relative(tiles, win, -1).focus()
    layout()

    //UGLY HACK AROUND STRANGE ERROR WHERE
    //KB SHORTCUTS STOP WORKING WHEN YOU CLOSE ALL THE WINDOWS
    if(!Object.keys(all).length)
      spawn(process.env.TERM || 'xterm')
  })

  rw.on('ConfigureRequest', function (ev, win) {
    if(win.bounds)
      win.bounds.size.set(ev.width, ev.height)
    else
      win.resize(ev.width, ev.height)
  })

  var spawn = require('child_process').spawn

  //open terminal
  //Command-T/K
  rw.onKey(0x40, 45, function (ev) {
    if(ev.down)
      spawn(process.env.TERM || 'xterm')
  })  

  //Command-C/I
  rw.onKey(0x40, 31, function (ev) {
    if(ev.down)
      spawn(process.env.BROWSER || 'chromium')
  })  

  //Command-Esc
  rw.onKey(0x40, 9, function (ev) {
    if(ev.down) {
      console.log('quiting...')
      process.exit(0)
    }
  })

  //Command-Space
  rw.onKey(0x40, 65, function (ev) {
    if(ev.down) {
      console.log('SWITCH LAYOUT')
      tiling = !tiling
      layout()
    }
  })

  function relative(ary, item, dir) {
    var i = ary.indexOf(item)
    if(~i) {
      i = i + dir
      if(i < 0)
        i = ary.length + i
      if(i >= ary.length)
        i = i - ary.length
      var w = tiles[i]
      return w
    }
  }

  function swap (ary, a, b) {
    var i = ary.indexOf(a)
    var j = ary.indexOf(b)
    console.log('SWAP', i, j, ary.length - 1)
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
  
  //Command-Left
  rw.onKey(0x40, 113, function (ev) {
    if(ev.down) {
      var f = relative(tiles, focused, -1)
      if(f) focused = f.focus()
    }
  })
  rw.onKey(0x40, 114, function (ev) {
    if(ev.down) {
      var f = relative(tiles, focused, 1)
      if(f) focused = f.focus()
    }
  })

  //Command-Left
  rw.onKey(0x41, 113, function (ev) {
    if(ev.down) {
      if(!focused) focused = tiles[0].focus()
      var _focused = relative(tiles, focused, -1)
      console.log('F,_F', focused.id, _focused.id)
      swap(tiles, focused, _focused)
  //    focused = _focused.focus()
      layout()
    }
  })
  rw.onKey(0x41, 114, function (ev) {
    if(ev.down) {
      if(!focused) focused = tiles[0].focus()
      var _focused = relative(tiles, focused, 1)
      console.log('F,_F', focused.id, _focused.id)
      swap(tiles, focused, _focused)
      layout()
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

