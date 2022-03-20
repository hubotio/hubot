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
  execute (context, next, lastDone) {
    const self = this

    if (lastDone == null) {
      lastDone = function () {}
    }

    // Execute each piece of middleware, collecting the latest 'done' callback
    // at each step.
    const m = this.compose(self.stack)
    process.nextTick(() => {
      m(context, next, lastDone)
    })
  }

  // modified from koa-compose - https://github.com/koajs/compose/blob/master/index.js
  compose (middleware) {
    const robot = this.robot
    if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
    for (const fn of middleware) {
      if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
    }
    return function (context, next, finallyDone) {
      let index = -1
      let previousDone = null
      return dispatch(0)
      function dispatch (i, done) {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'))
        if (i > middleware.length) return Promise.resolve()
        if (i === 0) done = finallyDone
        if (done) {
          previousDone = done
        } else {
          done = previousDone
        }
        index = i
        if (i === middleware.length) return Promise.resolve(next(context, done))
        const fn = middleware[i]
        try {
          return Promise.resolve(fn(context, dispatch.bind(null, i + 1), done))
        } catch (err) {
          robot.emit('error', err, context.response)
          return Promise.reject(done(err))
        }
      }
    }
  }

  // Public: Registers new middleware
  //
  // middleware - A generic pipeline component function that can either
  //              continue the pipeline or interrupt it. The function is called
  //              with (robot, context, next, done). If execution should
  //              continue (next middleware, final callback), the middleware
  //              should call the 'next' function with 'done' as an optional
  //              argument.
  //              If not, the middleware should call the 'done' function with
  //              no arguments. Middleware may wrap the 'done' function in
  //              order to execute logic after the final callback has been
  //              executed.
  //
  // Returns nothing.
  register (middleware) {
    if (middleware.length !== 3) {
      throw new Error(`Incorrect number of arguments for middleware callback (expected 3, got ${middleware.length})`)
    }
    this.stack.push(middleware)
  }
}

module.exports = Middleware
