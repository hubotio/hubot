# This is the Hubot Loading Bay.  NPM uses it as an entry point.
#
#     Hubot = require 'hubot'
#     YourBot = Hubot.robot 'campfire', 'yourbot'

exports.loadBot = (adapterPath, adapterName, enableHttpd, botName) ->
  robot = require './src/robot'
  new robot adapterPath, adapterName, enableHttpd, botName

exports.robot = ->
  require './src/robot'

exports.adapter = ->
  require './src/adapter'

exports.tests = ->
  require './test/tests'
