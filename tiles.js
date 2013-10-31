var x11 = require('x11')
var X

var Layout = require('./layout')

require('./xorg')(function (err, client, display) {
  if(err) throw err

  var rw = client.root

  var l = new Layout(rw)

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
    children.forEach(l.add.bind(l))
    l.layout()
  })

  rw.on('MapRequest', function (ev, win) {
    //load the window's properties, and then lay it out.
    win.load(function () {
      l.add(win)
      win.map()
      l.layout()
    })
    win.set({eventMask: x11.eventMask.EnterWindow})
  })

  rw.on('DestroyNotify', function (ev, win) {
    l.remove(win)
    //UGLY HACK AROUND STRANGE ERROR WHERE
    //KB SHORTCUTS STOP WORKING WHEN YOU CLOSE ALL THE WINDOWS
    if(!l.tiles.length)
      spawn(process.env.TERM || 'xterm')
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

  function close (ev) {
    if(ev.down && l.focused) {
      var _focused = l.focused
      l.cycle(-1)
      _focused.close()
    }
  }

  rw.onKey(0x40, 53, close) //command-Q
  rw.onKey(0x40, 59, close) //command-W
})

