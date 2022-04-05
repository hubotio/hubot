'use strict'
import {inspect} from 'util'
import {TextMessage} from './message.mjs'
import Middleware from './middleware.mjs'

export class Listener {
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
    this.options = options
    this.callback = callback

    if (this.matcher == null) {
      throw new Error('Missing a matcher for Listener')
    }

    if (this.callback == null) {
      this.callback = this.options
      this.options = {}
    }

    if (this.options.id == null) {
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
  // callback - Optional Function called with a boolean of whether the matcher matched
  //
  // Returns a boolean of whether the matcher matched.
  // Returns before executing callback
  async call (message, middleware, didMatchCallback) {
    // middleware argument is optional
    if (didMatchCallback == null && typeof middleware === 'function') {
      didMatchCallback = middleware
      middleware = undefined
    }

    // ensure we have a Middleware object
    if (middleware == null) {
      middleware = new Middleware(this.robot)
    }

    const match = this.matcher(message)
    if(!match){
      if (didMatchCallback != null) {
        didMatchCallback(false)
      }
      return null
    }

    if (this.regex) {
      this.robot.logger.debug(`Message '${message}' matched regex /${inspect(this.regex)}/; listener.options = ${inspect(this.options)}`)
    }

    const response = new this.robot.Response(this.robot, message, match)
    let shouldExecuteCallback = true
    try{
      await middleware.execute({ listener: this, response })
    }catch(err){
      this.robot.emit('error', err, response)
      shouldExecuteCallback = false
    }
    shouldExecuteCallback = shouldExecuteCallback && !response.message.done
    this.robot.logger.debug(`Executing listener callback for Message '${message}'`)
    try {
      if(shouldExecuteCallback) this.callback(response)
    } catch (err) {
      this.robot.emit('error', err, response)
    } finally {
      if (didMatchCallback != null) {
        didMatchCallback(true)
      }
    }
    return response
  }
}

export class TextListener extends Listener {
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
