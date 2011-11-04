# This is the Hubot Loading Bay.  NPM uses it as an entry point.
#
#     Hubot = require 'hubot'
#     YourBot = Hubot.robot 'campfire', 'blah', 'yourbot'

# Loads a Hubot robot
exports.loadBot = (adapterName, botName) ->
  robot = require "./src/adapters/#{adapterName}"
  new robot botName

exports.robot = ->
  require './src/robot'

# Loads the Hubot test harness.
exports.tests = ->
  require './test/tests'

