{inspect} = require 'util'
async     = require 'async'

{TextMessage} = require './message'

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

    if not @callback?
      throw new Error "Missing a callback for Listener"

  # Public: Determines if the listener likes the content of the message. If
  # so, a Response built from the given Message is passed through all
  # registered middleware and potentially the Listener callback. Note that
  # middleware can intercept the message and prevent the callback from ever
  # being executed.
  #
  # message - A Message instance.
  #
  # @callback - Call with a boolean of whether the matcher matched.
  call: (message, cb) ->
    if match = @matcher message
      if @regex
        @robot.logger.debug \
          "Message '#{message}' matched regex /#{inspect @regex}/"

      # special middleware-like function that always executes the Listener's
      # callback and calls done (never calls 'next')
      executeListener = (response, done) =>
        @robot.logger.debug "Executing listener callback for Message '#{message}'"
        try
          @callback response
          done()
        catch err
          @emit('error', err, response)

      # When everything is finished (down the middleware stack and back up),
      # pass control back to the robot
      allDone = () ->
        # Yes, we tried to execute the listener callback (middleware may
        # have intercepted before actually executing though)
        cb true

      response = new @robot.Response(@robot, message, match)
      @executeAllMiddleware response, executeListener, allDone
    else
      # No, we didn't try to execute the listener callback
      cb false

  # Execute all middleware in order and call 'next' with the latest 'done'
  # callback if last middleware calls through. If all middleware is compliant,
  # 'done' should be called with no arguments when the entire round trip is
  # complete.
  #
  # response - Response object to eventually pass to the Listener callback
  #
  # next(response, done) - Called when all middleware is complete (assuming
  #     all continued by calling respective 'next' functions)
  #
  # done() - Initial (final) completion callback. May be wrapped by
  #     executed middleware.
  #
  # Returns nothing
  executeAllMiddleware: (response, next, done) ->
    allMiddleware = @robot.middleware.listener

    # Execute a single piece of middleware and update the completion callback
    # (each piece of middleware can wrap the 'done' callback with additional
    # logic).
    executeMiddleware = (doneFunc, middlewareFunc, cb) =>
      nextFunc = (newDoneFunc) -> cb(null, newDoneFunc)
      middlewareFunc.call(undefined, @robot, @, response, nextFunc, doneFunc)

    # Executed when the middleware stack is finished
    allDone = (err, finalDoneFunc) -> next(response, finalDoneFunc)

    # Execute each piece of middleware, collecting the latest 'done' callback
    # at each step.
    async.reduce(allMiddleware, done, executeMiddleware, allDone)

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
