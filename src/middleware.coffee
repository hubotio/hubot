async = require 'async'

class Middleware
  # We use this recursively, and using nextTick recursively is deprecated in node 0.10.
  @ticker: if typeof setImmediate is "function" then setImmediate else process.nextTick

  constructor: (@robot) ->
    @stack = []

  # Public: Execute all middleware in order and call 'next' with the latest
  # 'done' callback if last middleware calls through. If all middleware is
  # compliant, 'done' should be called with no arguments when the entire
  # round trip is complete.
  #
  # context - context object that is passed through the middleware stack.
  #     When handling errors, this is assumed to have a `response` property.
  #
  # next(context, done) - Called when all middleware is complete (assuming
  #     all continued by calling respective 'next' functions)
  #
  # done() - Initial (final) completion callback. May be wrapped by
  #     executed middleware.
  #
  # Returns nothing
  # Returns before executing any middleware
  execute: (context, next, done) ->
    done ?= ->
    # Execute a single piece of middleware and update the completion callback
    # (each piece of middleware can wrap the 'done' callback with additional
    # logic).
    executeSingleMiddleware = (doneFunc, middlewareFunc, cb) =>
      # Match the async.reduce interface
      nextFunc = (newDoneFunc) -> cb(null, newDoneFunc or doneFunc)
      # Catch errors in synchronous middleware
      try
        middlewareFunc.call(undefined, context, nextFunc, doneFunc)
      catch err
        # Maintaining the existing error interface (Response object)
        @robot.emit('error', err, context.response)
        # Forcibly fail the middleware and stop executing deeper
        doneFunc()

    # Executed when the middleware stack is finished
    allDone = (_, finalDoneFunc) -> next(context, finalDoneFunc)

    # Execute each piece of middleware, collecting the latest 'done' callback
    # at each step.
    process.nextTick =>
      async.reduce(@stack, done, executeSingleMiddleware, allDone)

  # Public: Registers new middleware
  #
  # middleware - A generic pipeline component function that can either
  #              continue the pipeline or interrupt it. The function is called
  #              with (robot, context, next, done). If execution should
  #              continue (next middleware, final callback), the middleware
  #              should call the 'next' function with 'done' as an optional
  #              argument.
  #              If not, the middleware should call the 'done' function with
  #              no arguments. Middleware may wrap the 'done' function in
  #              order to execute logic after the final callback has been
  #              executed.
  #
  # Returns nothing.
  register: (middleware) ->
    if middleware.length != 3
      throw new Error("Incorrect number of arguments for middleware callback (expected 3, got #{middleware.length})")
    @stack.push middleware
    return undefined

module.exports = Middleware
