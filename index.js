'use strict'

const inherits = require('util').inherits

const botforgeExport = require('./es2015')

// make all es2015 class declarations compatible with CoffeeScript’s extend
module.exports = Object.keys(botforgeExport).reduce((map, current) => {
  if (current !== 'loadBot') {
    map[current] = makeClassCoffeeScriptCompatible(botforgeExport[current])
  } else {
    map[current] = botforgeExport[current]
  }
  return map
}, {})

function makeClassCoffeeScriptCompatible (klass) {
  function CoffeeScriptCompatibleClass () {
    const Hack = Function.prototype.bind.apply(klass, [null].concat([].slice.call(arguments)))
    const instance = new Hack()

    // pass methods from child to returned instance
    for (const key in this) {
      instance[key] = this[key]
    }

    // support for constructor methods which call super()
    // in which this.* properties are set
    for (const key in instance) {
      this[key] = instance[key]
    }

    return instance
  }
  inherits(CoffeeScriptCompatibleClass, klass)

  return CoffeeScriptCompatibleClass
}
