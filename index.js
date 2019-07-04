'use strict'

const inherits = require('util').inherits

const hubotExport = require('./es2015')

module.exports = Object.keys(hubotExport).reduce((map, current) => {
  map[current] = hubotExport[current]
  return map
}, {})
