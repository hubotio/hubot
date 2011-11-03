# This is the Hubot Loading Bay.  NPM uses it as an entry point.
#
#     Hubot = require 'hubot'
#     YourBot = Hubot.robot 'campfire', 'blah', 'yourbot'

# Loads a Hubot robot
exports.loadBot = (adapterName, options = { }) ->
  robot = require "./src/hubot/#{adapterName}"
  new robot options

exports.robot = ->
  require './src/robot'

# Loads the Hubot test harness.
exports.tests = ->
  require './test/tests'

