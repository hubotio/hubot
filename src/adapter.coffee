{EventEmitter} = require 'events'

class Adapter extends EventEmitter
  # An adapter is a specific interface to a chat source for robots.
  #
  # robot - A Robot instance.
  constructor: (@robot) ->

  # Public: Raw method for sending data back to the chat source. Extend this.
  #
  # envelope - A Object with message, room and user details.
  # strings  - One or more Strings for each message to send.
  #
  # Returns nothing.
  send: (envelope, strings...) ->

  # Public: Raw method for building a reply and sending it back to the chat
  # source. Extend this.
  #
  # envelope - A Object with message, room and user details.
  # strings  - One or more Strings for each reply to send.
  #
  # Returns nothing.
  reply: (envelope, strings...) ->

  # Public: Raw method for setting a topic on the chat source. Extend this.
  #
  # envelope - A Object with message, room and user details.
  # strings  - One more more Strings to set as the topic.
  #
  # Returns nothing.
  topic: (envelope, strings...) ->

  # Public: Raw method for playing a sound in the chat source. Extend this.
  #
  # envelope - A Object with message, room and user details.
  # strings  - One or more strings for each play message to send.
  #
  # Returns nothing
  play: (envelope, strings...) ->

  # Public: Raw method for invoking the bot to run. Extend this.
  #
  # Returns nothing.
  run: ->

  # Public: Raw method for shutting the bot down. Extend this.
  #
  # Returns nothing.
  close: ->

  # Public: Dispatch a received message to the robot.
  #
  # Returns nothing.
  receive: (message) ->
    @robot.receive message

module.exports = Adapter
