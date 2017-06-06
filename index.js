'use strict'

const inherits = require('util').inherits

const hubotExport = require('./es2015')

// make all es2015 class declarations compatible with CoffeeScript’s extend
// see https://github.com/hubotio/evolution/pull/4#issuecomment-306437501
module.exports = Object.keys(hubotExport).reduce((map, current) => {
  if (current !== 'loadBot') {
    map[current] = makeClassCoffeeScriptCompatible(hubotExport[current])
  } else {
    map[current] = hubotExport[current]
  }
  return map
}, {})

function makeClassCoffeeScriptCompatible (klass) {
  function CoffeeScriptCompatibleClass () {
    const Hack = Function.prototype.bind.apply(klass, [ null ].concat([].slice.call(arguments)))
    return new Hack()
  }
  inherits(CoffeeScriptCompatibleClass, klass)

  return CoffeeScriptCompatibleClass
}
