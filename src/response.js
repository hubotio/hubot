'use strict'

class Response {
  // Public: Responses are sent to matching listeners. Messages know about the
  // content and user that made the original message, and how to reply back to
  // them.
  //
  // robot   - A Robot instance.
  // message - A Message instance.
  // match   - A Match object from the successful Regex match.
  constructor (robot, message, match) {
    this.robot = robot
    this.message = message
    this.match = match
    this.envelope = {
      room: this.message.room,
      user: this.message.user
    }
  }

  // Public: Posts a message back to the chat source
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns result from middleware.
  async send (...strings) {
    return await this.#runWithMiddleware('send', { plaintext: true }, ...strings)
  }

  // Public: Posts an emote back to the chat source
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns result from middleware.
  async emote (...strings) {
    return await this.#runWithMiddleware('emote', { plaintext: true }, ...strings)
  }

  // Public: Posts a message mentioning the current user.
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns result from middleware.
  async reply (...strings) {
    return await this.#runWithMiddleware('reply', { plaintext: true }, ...strings)
  }

  // Public: Posts a topic changing message
  //
  // strings - One or more strings to set as the topic of the
  //           room the bot is in.
  //
  // Returns result from middleware.
  async topic (...strings) {
    return await this.#runWithMiddleware('topic', { plaintext: true }, ...strings)
  }

  // Public: Play a sound in the chat source
  //
  // strings - One or more strings to be posted as sounds to play. The order of
  //           these strings should be kept intact.
  //
  // Returns result from middleware.
  async play (...strings) {
    return await this.#runWithMiddleware('play', {}, ...strings)
  }

  // Public: Posts a message in an unlogged room
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns result from middleware.
  async locked (...strings) {
    await this.#runWithMiddleware('locked', { plaintext: true }, ...strings)
  }

  // Call with a method for the given strings using response
  // middleware.
  async #runWithMiddleware (methodName, opts, ...strings) {
    const context = {
      response: this,
      strings,
      method: methodName
    }

    if (opts.plaintext != null) {
      context.plaintext = true
    }

    const shouldContinue = await this.robot.middleware.response.execute(context)
    if (shouldContinue === false) return
    return await this.robot.adapter[methodName](this.envelope, ...context.strings)
  }

  // Public: Picks a random item from the given items.
  //
  // items - An Array of items.
  //
  // Returns a random item.
  random (items) {
    return items[Math.floor(Math.random() * items.length)]
  }

  // Public: Tell the message to stop dispatching to listeners
  //
  // Returns nothing.
  finish () {
    this.message.finish()
  }

  // Public: Creates a scoped http client with chainable methods for
  // modifying the request. This doesn't actually make a request though.
  // Once your request is assembled, you can call `get()`/`post()`/etc to
  // send the request.
  //
  // Returns a ScopedClient instance.
  http (url, options) {
    return this.robot.http(url, options)
  }
}

module.exports = Response
