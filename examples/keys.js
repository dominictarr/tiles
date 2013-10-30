var xorg = require('../xorg')
var x11 = require('x11')

//NOTE, THIS ONLY WORKS WHEN RUNNING WITH Xephyr
//but, it's useful for figuring out key combinations.

//I notice there is a process.env.WINDOWID set, is this the current window?

xorg(function (err, dis) {

  dis.root.set({
    eventMask: x11.eventMask.KeyPress | x11.eventMask.KeyRelease
  })

  var shift = 1
  var capslock = 2
  var ctrl = 4
  var alt = 8
  var meta = 8
  var command = 64
  var win = 64

  var modifiers = {
    '66': capslock,
    '50': shift,
    '37': ctrl,
    '64': alt,
    '133': command,
    '134': command,
    '108': alt
  }

  function print () {
    var k = Object.keys(keys)
    if(!k.length) return
    console.log('[0x' + M.toString(16) + ', ' +  parseInt(k[0]) + ']')
  }

  var M = 0
  var keys = {}

  dis.root.on('KeyPress', function (ev) {
    if(modifiers[ev.keycode])
      M = M | modifiers[ev.keycode]
    else
      keys[ev.keycode] = true
    print()
  })

  dis.root.on('KeyRelease', function (ev) {
    if(modifiers[ev.keycode])
      M = M ^ modifiers[ev.keycode]
    else
      keys[ev.keycode] = true
    delete keys[ev.keycode]
    print()
  })

})
