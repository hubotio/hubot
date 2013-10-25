{EventEmitter} = require 'events'

HUBOT_DEFAULT_ADAPTERS = [
  'campfire'
  'shell'
  'test'
]

class Adapter extends EventEmitter
  # Load the adapter Hubot is going to use.
  #
  # path    - A String of the path to adapter if local.
  # adapter - A String of the adapter name to use.
  #
  # Returns nothing.
  @load: (robot, path, adapter) ->
    robot.logger.debug "Loading adapter #{adapter}"

    try
      path = if adapter in HUBOT_DEFAULT_ADAPTERS
        "#{path}/#{adapter}"
      else
        "hubot-#{adapter}"

      robot.adapter = require(path).use robot
    catch err
      robot.logger.error "Cannot load adapter #{adapter}:\n#{err.stack}"
      process.exit 1

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

  # Public: Raw method for sending emote data back to the chat source.
  # Defaults as an alias for send
  #
  # envelope - A Object with message, room and user details.
  # strings  - One or more Strings for each message to send.
  #
  # Returns nothing.
  emote: (envelope, strings...) ->
    @send envelope, strings...

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
    console.log "adapter.receive #{require('util').inspect message}"

    @robot.receive message

module.exports = Adapter
