'use strict'

const inspect = require('util').inspect

const TextMessage = require('./message').TextMessage
const Middleware = require('./middleware')

class Listener {
  // Listeners receive every message from the chat source and decide if they
  // want to act on it.
  // An identifier should be provided in the options parameter to uniquely
  // identify the listener (options.id).
  //
  // robot    - A Robot instance.
  // matcher  - A Function that determines if this listener should trigger the
  //            callback.
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is triggered if the incoming message matches.
  constructor (robot, matcher, options, callback) {
    this.robot = robot
    this.matcher = matcher
    this.options = options ?? {}
    this.callback = callback

    if (this.matcher == null) {
      throw new Error('Missing a matcher for Listener')
    }

    if (!this.callback) {
      this.callback = this.options
      this.options = {}
    }

    if (!this.options?.id) {
      this.options.id = null
    }

    if (this.callback == null || typeof this.callback !== 'function') {
      throw new Error('Missing a callback for Listener')
    }
  }

  // Public: Determines if the listener likes the content of the message. If
  // so, a Response built from the given Message is passed through all
  // registered middleware and potentially the Listener callback. Note that
  // middleware can intercept the message and prevent the callback from ever
  // being executed.
  //
  // message - A Message instance.
  // middleware - Optional Middleware object to execute before the Listener callback
  //
  // Returns the result of the callback.
  async call (message, middleware) {
    if (middleware && typeof middleware === 'function') {
      const fn = middleware
      middleware = new Middleware(this.robot)
      middleware.register(fn)
    }

    if (!middleware) {
      middleware = new Middleware(this.robot)
    }

    const match = this.matcher(message)
    if (!match) return null
    if (this.regex) {
      this.robot.logger.debug(`Message '${message}' matched regex /${inspect(this.regex)}/; listener.options = ${inspect(this.options)}`)
    }

    const response = new this.robot.Response(this.robot, message, match)

    try {
      const shouldContinue = await middleware.execute({ listener: this, response })
      if (shouldContinue === false) return null
    } catch (e) {
      this.robot.logger.error(`Error executing middleware for listener: ${e.stack}`)
    }
    try {
      return await this.callback(response)
    } catch (e) {
      this.robot.logger.error(`Error executing listener callback: ${e.stack}`)
      this.robot.emit('error', e, response)
    }
    return null
  }
}

class TextListener extends Listener {
  // TextListeners receive every message from the chat source and decide if they
  // want to act on it.
  //
  // robot    - A Robot instance.
  // regex    - A Regex that determines if this listener should trigger the
  //            callback.
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is triggered if the incoming message matches.
  constructor (robot, regex, options, callback) {
    function matcher (message) {
      if (message instanceof TextMessage) {
        return message.match(regex)
      }
    }

    super(robot, matcher, options, callback)
    this.regex = regex
  }
}

module.exports = {
  Listener,
  TextListener
}
