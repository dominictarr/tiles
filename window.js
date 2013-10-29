
var methods = [ 'CreateWindow',
  'ChangeWindowAttributes',
  'GetWindowAttributes',
  'DestroyWindow',
  'ChangeSaveSet',
  'ReparentWindow',
  'MapWindow',
  'UnmapWindow',
  'ConfigureWindow',
  'ResizeWindow',
  'MoveWindow',
  'MoveResizeWindow',
  'RaiseWindow',
  'QueryTree',
  'InternAtom',
  'GetAtomName',
  'ChangeProperty',
  'DeleteProperty',
  'GetProperty',
  'ListProperties',
  'SetSelectionOwner',
  'GetSelectionOwner',
  'ConvertSelection',
  'SendEvent',
  'GrabPointer',
  'UngrabPointer',
  'GrabButton',
  'UngrabButton',
  'ChangeActivePointerGrab',
  'GrabKeyboard',
  'UngrabKeyboard',
  'GrabKey',
  'UngrabKey',
  'QueryPointer',
  'TranslateCoordinates',
  'SetInputFocus',
  'GetInputFocus',
  'WarpPointer',
  'ListFonts',
  'CreatePixmap',
  'CreateGC',
  'ChangeGC',
  'CopyArea',
  'PolyPoint',
  'PolyLine',
  'PolyFillRectangle',
  'PolyFillArc',
  'PutImage',
  'GetImage',
  'PolyText8',
  'CreateColormap',
  'AllocColor',
  'QueryExtension',
  'ListExtensions',
  'GetKeyboardMapping',
  'GetGeometry',
  'KillKlient',
  'SetScreenSaver',
  'ForceScreenSaver',
  'AllocID' ]

module.exports = function (client) {
  console.log(client)
  var methods = []
  for(var k in client)
    if(/^[A-Z]/.test(k))
      methods.push(k)

  console.log(methods)
  function Window () {

  }

}
