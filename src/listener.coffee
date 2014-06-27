{inspect} = require 'util'
async     = require 'async'

{TextMessage} = require './message'

class Listener
  # Listeners receive every message from the chat source and decide if they
  # want to act on it.
  #
  # robot    - A Robot instance.
  # matcher  - A Function that determines if this listener should trigger the
  #            callback.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # handler  - A Function that is triggered if the incoming message matches.
  constructor: (@robot, @matcher, @options, @handler) ->
    if not @handler?
      @handler = @options
      @options = {}

  # Public: Determines if the listener likes the content of the message. If
  # so, a Response built from the given Message is passed to the Listener
  # callback.
  #
  # message - A Message instance.
  #
  # @callback - Call with a boolean of whether the matcher matched.
  call: (message, cb) ->
    if match = @matcher message
      if @regex
        @robot.logger.debug \
          "Message '#{message}' matched regex /#{inspect @regex}/"
      response = new @robot.Response(@robot, message, match)
      @testAllHooks response, (result) =>
        if result
          @robot.logger.debug "Message '#{message}' passed all hooks"
          @handler response
          cb true
        else
          @robot.logger.debug "Message '#{message}' failed some/all hooks"
          cb false
    else
      cb false

  testAllHooks: (msg, callback) ->
    wrappedHooks = []
    # Wrap all hooks for execution
    Listener.hooks.forEach (hook) =>
      wrappedHooks.push (cb) =>
        hook(@robot, this, @options, msg, cb)

    # Execute all hooks
    async.parallel wrappedHooks, (err, results) ->
      allHooksPassed = true
      results.forEach (result) ->
        allHooksPassed = allHooksPassed && result
      callback(allHooksPassed)

class TextListener extends Listener
  # TextListeners receive every message from the chat source and decide if they
  # want to act on it.
  #
  # robot    - A Robot instance.
  # regex    - A Regex that determines if this listener should trigger the
  #            callback.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # handler - A Function that is triggered if the incoming message matches.
  constructor: (@robot, @regex, @options, @handler) ->
    @matcher = (message) =>
      if message instanceof TextMessage
        message.match @regex
    super @robot, @matcher, @options, @handler

Listener.hooks = []

module.exports = {
  Listener
  TextListener
}
