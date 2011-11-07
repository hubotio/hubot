# This is the Hubot Loading Bay.  NPM uses it as an entry point.
#
#     Hubot = require 'hubot'
#     YourBot = Hubot.robot 'campfire', 'yourbot'

# Loads a Hubot robot
exports.loadBot = (adapterName, botName) ->
  robot = require './src/robot'
  new robot adapterName, botName

exports.robot = ->
  require './src/robot'

# Loads the Hubot test harness.
exports.tests = ->
  require './test/tests'

