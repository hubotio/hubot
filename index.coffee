# Loads a Hubot robot
exports.robot = (adapterName, path, botName) ->
  robot = require "./src/hubot/#{adapterName}"
  new robot path, botName

# Loads the Hubot test harness.
exports.tests = ->
  require './test/tests'

