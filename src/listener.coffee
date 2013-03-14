{TextMessage} = require './message'

inspect = require('util').inspect;

class Listener
  constructor: (@robot, @matcher, @callback) ->

  call: (message) ->
    if match = @matcher message
      @robot.logger.debug "Message '#{message}' matched regex /#{inspect @regex}/" if @regex
      @callback new @robot.Response(@robot, message, match)
      true
    else
      false

class TextListener extends Listener
  constructor: (@robot, @regex, @callback) ->
    @matcher = (message) =>
      if message instanceof TextMessage
        message.match @regex

module.exports = {
  Listener
  TextListener
}
