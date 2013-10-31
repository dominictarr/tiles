
exports.each     = each
exports.remove   = remove
exports.find     = find
exports.swap     = swap
exports.relative = relative

function each(obj, iter) {
  for(var k in obj)
    iter(obj[k], k, obj)
}

function remove (array, item) {
  var i = array.indexOf(item)
  console.log(array.map(function (e) { return e.id}), i)
  if(~i) array.splice(i, 1)
  console.log(array, '-')
}

function find (ary, test) {
  for(var i in ary)
    if(test(ary[i], i, ary))
      return ary[i]
}

function swap (ary, a, b) {
  var i = ary.indexOf(a)
  var j = ary.indexOf(b)
  //if the window is the first or last, do not swap,
  //instead shift/pop so that overall order is preserved.

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


function relative(ary, item, dir) {
  var i = ary.indexOf(item)
  if(~i) {
    i = i + dir
    if(i < 0)
      i = ary.length + i
    if(i >= ary.length)
      i = i - ary.length
    var w = ary[i]
    return w
  }
}


