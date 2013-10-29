var h = require('hyperscript')
var o = require('observable')

var Vec2 = require('vec2')
var Rec2 = require('rec2')

var elementRec2 = function (el) {
  var rec = el.getBoundingClientRect()
  return new Rec2(rec.left, rec.top, rec.width, rec.height)
}

var mouseEventVec2 = function (ev) {
  return new Vec2(ev.clientX, ev.clientY)
}

var mouse = new Vec2()

window.addEventListener('mousemove', function (e) {
  mouse.set(e.clientX, e.clientY)
})

var scroll = new Vec2()

window.addEventListener('scroll', function (e) {
  scroll.set(window.scrollX, window.scrollY)
})

var screenSize = new Vec2()

window.addEventListener('resize', function (e) {
  screenSize.set(window.innerWidth, window.innerHeight)
})

function oVec(vec) {
  var v = o()
  v(vec)
  vec.change(v)
  return v
}

var docSize = elementRec2(document.body).size

document.body.appendChild(h('pre',
  {style: {
    position: 'fixed',
    right: '20px',
    top: '20px',
    'z-index': 999
  }},
  o.compute([oVec(mouse), oVec(scroll), oVec(screenSize)],
    function (m, scroll, size) {
      return JSON.stringify({mouse: m, scroll: scroll, size: size, doc: docSize}, false, 2)
    })
  )
)

//COMMENT BEFORE PUBLISHING
require('console-log')

var root = {top: o(), left: o(), width: o(), height: o()}

root.top(0); root.left(0)

function px (v) {
  return o.transform(v,
    function (n) {return n + 'px'},
    function (s) {return s.replace('px', '')}
  )
}

function mul(v, x) {
  return o.transform(v,
    function (a) {return a * x},
    function (b) {return b / x}
  )
}

function add(v, x) {
  return o.transform(v,
    function (a) {return a + x},
    function (b) {return b - x}
  )
}

var body = document.body

function update() {
  var rect = body.getBoundingClientRect()
  ;['width', 'height', 'left', 'top']
  .forEach(function (d) {
    root[d](rect[d])
  })
}

//process.nextTick(update)
window.onresize = update

setTimeout(update, 100)

body.appendChild(
  root.element = h('div', {style: {
    background: 'red',
    margin: '0px',
    position: 'absolute',
    left:   px(root.left),
    top:    px(root.top),
    width:  px(mul(root.width, 1)),
    bottom: px(root.height)
  }}, 'hello there')
)

function split (parent, children) {

  function update() {
    var left = 0
    var width = parent.width() / children.length
    children.forEach(function (e) {
      e.height(parent.height())
      e.top(0)
      e.width(width)
      e.left(left)
      console.log(e)
      left += width
    })
  }

  children.forEach(function (e) {
    parent.element.appendChild(e.element)
  })
  parent.width(update)
  update()
}

function num(n) {
  var v = o()
  v(n || 0)
  return v
}

function pane () {
  var args = [].slice.call(arguments)
  var self = {
    left: num(),
    top: num(),
    width: num(),
    height: num()
  }
  self.element = h('div', {style: {
      border: 'solid 1px black',
      position: 'absolute',
      left:   px(self.left),
      top:    px(self.top),
      width:  px(self.width),
      bottom: px(self.height)
    }}, args)
  
  return self
}


var dragging

var over = []
window.onmouseover = function (e) {
  if(dragging) {
    if(!~over.indexOf(e.target))
      over.push(e.target)

    var t = e.target
  }
}

function point(e) {
  return {
    x: e.clientX || e.clientLeft || e.x,
    y: e.clientY || e.clientTop  || e.y
  }
}

function bounds(e) {
  if(e.getBoundingClientRect)
    e = e.getBoundingClientRect()

  return {
    x: e.left   || e.x || 0,
    y: e.top    || e.y || 0,
    w: e.width  || e.w || 0,
    h: e.height || e.h || 0
  }
}

function inside(_p, _b) {
  var p = point(_p), b = bounds(_b)
  var ins = (
     p.x < b.x + b.w && b.x <= p.x
  && p.y < b.y + b.h && b.y <= p.y
  )
  return ins
}

window.onmouseup = function (e) {
  if(dragging)
    body.removeChild(dragging)
  dragging = null
  over.length = 0
}

function dragable (el, opts) {
  opts = opts || {}
  var self
  el.addEventListener('mousedown', function (e) {
    var w = el
    if(opts.widget)
      w = opts.widget()

    var parentRect = w.parentElement.getBoundingClientRect()
    var myRect = w.getBoundingClientRect()

    var offset = {
      left: mouse.x - (myRect.left - parentRect.left),
      top : mouse.y - myRect.top - parentRect.top,
    }

    function mousemove () {
      w.style.left = (mouse.x - offset.left) + 'px'
      w.style.top  = (mouse.y - offset.top) + 'px'
    }

    mouse.change(mousemove)

    w.style.position = 'absolute'

    w.style.left = (mouse.x - offset.left) + 'px'
    w.style.top  = (mouse.y - offset.top) + 'px'

    window.addEventListener('mouseup', function m_up() {
      window.removeEventListener('mouseup', m_up, false)
      mouse.ignore(mousemove)
    }, false)

    e.preventDefault()
  })
  /*
  return self = h('div', 
    {style: {
//      position: 'absolute',
      width: '100%',
      border: 'solid 1px black'
    },
    onmousedown: function (e) {
      dragging = self
      body.appendChild(dragging = h('div',
        {style: {
          position: 'absolute',
          left: px(mouse.x),
          top: px(mouse.y),
          //suposedly this is experimental,
          //but works in FF and CHROME.
          //that is good enough!
          'pointer-events': 'none'
        }},
        'DRAG ME'
      ))
      e.preventDefault()
      }
    },
  args)
  */
  return el
}

var v = o()

var h1 = h('h1', 'HELLO',
      {style: {color: o.boolean(v, 'yellow', 'orange'),
        }}
    )
o.bind1(v, o.hover(h1)) //bind v to hover

split(root, [
  pane({style: {background: 'green'}}, h('h2', 'show'), 'SHOW...'),
  pane({style: {background: 'blue'}},  h('h2', 'some'), 'SOME...'),
  pane({style: {background: 'yello'}}, h('h2', 'stuff'), 'STUFF...', dragable(h1))
])



