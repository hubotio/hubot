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
      console.log "robot.receive #{require('util').inspect message}"
      
      response = new @robot.Response(@robot, message, match)
      @callback.call response, response
      true
    else
      false

module.exports = Listener
