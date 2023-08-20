'use strict'

class Middleware {
  constructor (robot) {
    this.robot = robot
    this.stack = []
  }

  // Public: Execute all middleware in order and call 'next' with the latest
  // 'done' callback if last middleware calls through. If all middleware is
  // compliant, 'done' should be called with no arguments when the entire
  // round trip is complete.
  //
  // context - context object that is passed through the middleware stack.
  //     When handling errors, this is assumed to have a `response` property.
  //
  // next(context, done) - Called when all middleware is complete (assuming
  //     all continued by calling respective 'next' functions)
  //
  // done() - Initial (final) completion callback. May be wrapped by
  //     executed middleware.
  //
  // Returns nothing
  // Returns before executing any middleware
  async execute (context) {
    let shouldContinue = true
    for await (const middleware of this.stack) {
      try {
        shouldContinue = await middleware(context)
        if (shouldContinue === false) break
      } catch (e) {
        this.robot.emit('error', e, context.response)
      }
    }
    return shouldContinue
  }

  // Public: Registers new middleware
  //
  // middleware - Middleware function to execute prior to the listener callback. Return false to prevent execution of the listener callback.
  //
  // Returns nothing.
  register (middleware) {
    if (middleware.length !== 1) {
      throw new Error(`Incorrect number of arguments for middleware callback (expected 3, got ${middleware.length})`)
    }
    this.stack.push(middleware)
  }
}

module.exports = Middleware
