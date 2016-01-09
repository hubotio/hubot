{inspect} = require 'util'
async     = require 'async'

{TextMessage} = require './message'
Middleware = require './middleware'

class Listener
  # Listeners receive every message from the chat source and decide if they
  # want to act on it.
  # An identifier should be provided in the options parameter to uniquely
  # identify the listener (options.id).
  #
  # robot    - A Robot instance.
  # matcher  - A Function that determines if this listener should trigger the
  #            callback.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is triggered if the incoming message matches.
  constructor: (@robot, @matcher, @options, @callback) ->
    if not @matcher?
      throw new Error "Missing a matcher for Listener"

    if not @callback?
      @callback = @options
      @options = {}

    if not @options.id?
      @options.id = null

    if not @callback? or typeof @callback != 'function'
      throw new Error "Missing a callback for Listener"

  # Public: Determines if the listener likes the content of the message. If
  # so, a Response built from the given Message is passed through all
  # registered middleware and potentially the Listener callback. Note that
  # middleware can intercept the message and prevent the callback from ever
  # being executed.
  #
  # message - A Message instance.
  # middleware - Optional Middleware object to execute before the Listener callback
  # callback - Optional Function called with a boolean of whether the matcher matched
  #
  # Returns a boolean of whether the matcher matched.
  # Returns before executing callback
  call: (message, middleware, cb) ->
    # middleware argument is optional
    if not cb? and typeof middleware is 'function'
      cb = middleware
      middleware = undefined

    # ensure we have a Middleware object
    if not middleware?
      middleware = new Middleware(@robot)

    if match = @matcher message
      if @regex
        @robot.logger.debug \
          "Message '#{message}' matched regex /#{inspect @regex}/; listener.options = #{inspect @options}"

      # special middleware-like function that always executes the Listener's
      # callback and calls done (never calls 'next')
      executeListener = (context, done) =>
        @robot.logger.debug "Executing listener callback for Message '#{message}'"
        try
          @callback context.response
        catch err
          @robot.emit('error', err, context.response)
        done()

      # When everything is finished (down the middleware stack and back up),
      # pass control back to the robot
      allDone = () ->
        # Yes, we tried to execute the listener callback (middleware may
        # have intercepted before actually executing though)
        if cb?
          process.nextTick -> cb true

      response = new @robot.Response(@robot, message, match)
      middleware.execute(
        {listener: @, response: response}
        executeListener
        allDone
      )
      true
    else
      if cb?
        # No, we didn't try to execute the listener callback
        process.nextTick -> cb false
      false

class TextListener extends Listener
  # TextListeners receive every message from the chat source and decide if they
  # want to act on it.
  #
  # robot    - A Robot instance.
  # regex    - A Regex that determines if this listener should trigger the
  #            callback.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is triggered if the incoming message matches.
  constructor: (@robot, @regex, @options, @callback) ->
    @matcher = (message) =>
      if message instanceof TextMessage
        message.match @regex
    super @robot, @matcher, @options, @callback

module.exports = {
  Listener
  TextListener
}
