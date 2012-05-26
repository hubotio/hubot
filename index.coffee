exports.loadBot = (adapterPath, adapterName, enableHttpd, botName) ->
  robot = require './src/robot'
  new robot adapterPath, adapterName, enableHttpd, botName

exports.robot = ->
  require './src/robot'

exports.adapter = ->
  require './src/adapter'

exports.tests = ->
  require './test/tests'
