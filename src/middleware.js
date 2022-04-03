'use strict'

class Middleware {
  constructor (robot) {
    this.robot = robot
    this.stack = []
  }

  // Public: Execute all middleware with await/async
  //
  // context - context object that is passed through the middleware stack.
  //     When handling errors, this is assumed to have a `response` property.
  //
  // Returns nothing
  // Returns before executing any middleware
  async execute (context) {
    for await (let middleware of this.stack) {
      await middleware(this.robot, context)
    }
    return context
  }

  // Public: Registers new middleware
  //
  // middleware - A generic pipeline component function
  //
  // Returns nothing.
  register (middleware) {
    this.stack.push(middleware)
  }
}

module.exports = Middleware
