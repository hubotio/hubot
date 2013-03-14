{EventEmitter} = require 'events'

class Adapter extends EventEmitter
  constructor: (@robot) ->

  send: (envelope, strings...) ->

  reply: (envelope, strings...) ->

  topic: (envelope, strings...) ->

  play: (envelope, strings...) ->

  run: ->

  close: ->

  receive: (message) ->
    @robot.receive message

  users: ->
    @robot.brain.users()

  userForId: (id, options) ->
    @robot.brain.userForId id, options

  userForName: (name) ->
    @robot.brain.userForName name

  usersForRawFuzzyName: (fuzzyName) ->
    @robot.brain.usersForRawFuzzyName fuzzyName

  usersForFuzzyName: (fuzzyName) ->
    @robot.brain.usersForFuzzyName fuzzyName

  http: (url) ->
    @robot.http(url)

module.exports = Adapter
