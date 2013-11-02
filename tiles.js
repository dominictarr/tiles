var x11 = require('x11')
var X

var Layout = require('./layout')
var u      = require('./utils')
var animate = require('./animate')

require('./xorg')(function (err, client, display) {
  if(err) throw err

  var rw = client.root, _prevFocus

  var layouts = [new Layout(rw)]

  var l = layouts[0]

  function cycleLayout(dir) {
    l._delay = Date.now() + l.delay
    l.hide()
    l = u.relative(layouts, l, dir || 1)
    l.show()
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
      win.kill()
      l.remove(win)
    })
    l.layout()
  })

  rw.on('MapRequest', function (ev, win) {
    //load the window's properties, and then lay it out.
    win.load(function () {
      //add to current layout
      var b = win.bounds
      win.bounds = animate(b)
      win.bounds.size = animate(b.size)
      win.configure({borderWidth: 1})
      win.on('focus', function () {
        if(_prevFocus)
          _prevFocus.set({ borderPixel: 0x0 })
        win.set({borderPixel: 0xffff00})
        _prevFocus = win
      })
      win.map()
      l.add(win)
      win.focus()
      win.raise()
      l.layout()
    })
    win.set({eventMask: x11.eventMask.EnterWindow})
  })

  rw.on('DestroyNotify', function (ev, win) {
    l.remove(win)
    //UGLY HACK AROUND STRANGE ERROR WHERE
    //KB SHORTCUTS STOP WORKING WHEN YOU CLOSE ALL THE WINDOWS
//    if(!l.tiles.length)
  //    spawn(process.env.TERM || 'xterm')
  })

  rw.on('ConfigureRequest', function (ev, win) {
    //prevent windows from sizing themselves?
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
    if(ev.down) l.toggle()
  })
  
  //Command-Left
  rw.onKey(0x40, 113, function (ev) {
    if(ev.down) l.cycle(-1)
  })
  rw.onKey(0x40, 114, function (ev) {
    if(ev.down) l.cycle(1)
  })

  //Command-Left
  rw.onKey(0x41, 113, function (ev) {
    if(ev.down) l.move(-1)
  })

  rw.onKey(0x41, 114, function (ev) {
    if(ev.down) l.move(1)
  })

  rw.onKey(0x40, 111, function (ev) {
    if(ev.down) cycleLayout(1)
  })

  rw.onKey(0x40, 116 , function (ev) {
    if(ev.down) cycleLayout(-1)
  })

  //Ctrl-N
  rw.onKey(0x40, 46 , function (ev) {
    if(!ev.down) return
    console.log('new layout')
    l.hide()
    layouts.push(l = new Layout(rw))
    l.show()
  })

  function close (ev) {
    if(l.tiles.length === 0) {
      if(layouts.length === 1) {
        console.log('all windows are closed')
        process.exit(0)
      }
      return closeLayout(ev)
    }
    if(ev.down && l.focused) {
      var _focused = l.focused
      //if there are no tiles in this layout,
      //close the space.
      if(l.tiles.length > 1)
      l.cycle(-1)
      _focused.close()
    }
  }

  function closeLayout (ev) {
    if(!ev.down) return
    var _l = u.relative(layouts, l, -1)
    if(layouts.length <= 1) return
    l.hide()
    l.closeAll()
    if(layouts.length) u.remove(layouts, l)
    l = _l
    _l.show()
  }

  rw.onKey(0x40, 53, close) //command-Q
  rw.onKey(0x40, 59, close) //command-W
  rw.onKey(0x41, 59, closeLayout) //command-W
})

