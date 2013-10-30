 
var x11 = require('x11')


x11.createClient(function (err, display) {

  var root = display.screen[0].root

  var client = display.client

  var shift    = 1
  var capslock = 2
  var ctrl     = 4
  var alt      = 8
  var meta     = 8
  var command  = 64
  var win      = 64

  var kb = {}

  function key(mod, key, listener) {
    kb[mod.toString('16') + '-' + key.toString(16)] = listener
    client.GrabKey(root, 0, mod, key, 0, 1)
  }

  key(0x40, 45, function (ev) {
    if(ev.start)
      console.log('terminal')
  })
  key(0x40, 31, function (ev) {
    if(ev.start)
      console.log('chromium')
  })
  key(0x40, 9, function (ev) {
    if(ev.start)
      console.log('quit')
  })

  client.on('event', function (ev) {
    if(ev.name === 'KeyPress' || ev.name === 'KeyRelease') {
      ev.start = (ev.name === 'KeyPress') 
      ev.end = !ev.start
      var l = kb[ev.buttons.toString(16) + '-' + ev.keycode.toString(16)]
      if(l) l(ev)
    }
  })
})
