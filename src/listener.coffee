{TextMessage} = require './message'

class Listener
  # Listeners receive every message from the chat source and decide if they
  # want to act on it.
  #
  # robot    - The current Robot instance.
  # matcher  - The Function that determines if this listener should trigger the
  #            callback.
  # callback - The Function that is triggered if the incoming message matches.
  constructor: (@robot, @matcher, @callback) ->

  # Public: Determines if the listener likes the content of the message.  If
  # so, a Response built from the given Message is passed to the Listener
  # callback.
  #
  # message - a Message instance.
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
  # robot    - The current Robot instance.
  # regex    - The Regex that determines if this listener should trigger the
  #            callback.
  # callback - The Function that is triggered if the incoming message matches.
  constructor: (@robot, @regex, @callback) ->
    @matcher = (message) =>
      if message instanceof TextMessage
        message.match @regex

module.exports.Listener     = Listener
module.exports.TextListener = TextListener
