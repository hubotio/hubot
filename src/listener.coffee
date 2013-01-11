{TextMessage, EnterMessage, LeaveMessage, TopicChangeMessage} = require './message'

class Listener
  # Listeners receive every message from the chat source and decide if they
  # want to act on it.
  #
  # robot    - A Robot instance.
  # matcher  - A Function that determines if this listener should trigger the
  #            callback.
  # callback - A Function that is triggered if the incoming message matches.
  constructor: (@robot, @matcher, @callback) ->

  # Public: Determines if the listener likes the content of the message. If
  # so, a Response built from the given Message is passed to the Listener
  # callback.
  #
  # message - A Message instance.
  #
  # Returns a boolean of whether the matcher matched.
  call: (message) ->
    if match = @matcher message
      @callback new @robot.Response(@robot, message, match)
      true
    else
      false

class TextListener extends Listener
  # TextListeners receive every message from the chat source and decide if they want
  # to act on it.
  #
  # robot    - A Robot instance.
  # regex    - A Regex that determines if this listener should trigger the
  #            callback.
  # callback - A Function that is triggered if the incoming message matches.
  constructor: (@robot, @regex, @callback) ->
    @matcher = (message) =>
      if message instanceof TextMessage
        message.match @regex

class MessageListener extends Listener
  # MessageListeners receive every message from the chat source and decide if
  # they wish to act on it based on the message type.
  #
  # robot     - A Robot instance
  # pattern   - A String or class name that should be matched
  # callback  - A Function that is triggered if the incoming message matches
  constructor: (@robot, @pattern, @callback) ->
    # If pattern is a string, convert it to a regex
    if ((typeof @pattern) == "string")
      @pattern = new RegExp(@pattern)

    @matcher = (message) =>
      # If the pattern is of type object, it is a RegExp to test
      # If it is a function, we need to test instanceof
      result = null
      switch typeof @pattern
        when "object"
          result = @pattern.test message.constructor.name
        when "function"
          result = message if message instanceof @pattern

      result

module.exports.Listener     = Listener
module.exports.TextListener = TextListener
module.exports.MessageListener = MessageListener
