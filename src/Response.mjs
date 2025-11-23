'use strict'

// Cheap Design: Define response method variations as data, not code.
// Each entry maps method name to options; methods are generated dynamically.
const RESPONSE_METHODS = {
  send: { plaintext: true },
  emote: { plaintext: true },
  reply: { plaintext: true },
  topic: { plaintext: true },
  play: {},
  locked: { plaintext: true }
}

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
      user: this.message.user,
      message: this.message
    }
  }

  // Public: Posts a message back to the chat source
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns result from middleware.
  // Note: This method is dynamically generated from RESPONSE_METHODS registry

  // Internal: Run the given method through response middleware and adapter.
  // Used by dynamically-generated response methods (send, emote, reply, etc).
  async _runWithMiddleware (methodName, opts, ...strings) {
    const context = {
      response: this,
      strings,
      method: methodName
    }

    if (opts.plaintext != null) {
      context.plaintext = true
    }

    // Cheap Design: Use Middleware.executeAndAllow() for cleaner conditional
    const shouldContinue = await this.robot.middleware.response.executeAndAllow(context)
    if (!shouldContinue) return
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

export default Response

// Cheap Design: Generate all response methods from the registry.
// This eliminates 60+ lines of duplicate method definitions. Each method
// is generated once by mapping over RESPONSE_METHODS and creating an
// async function that delegates to _runWithMiddleware with the appropriate
// method name and options. Adding new response types requires only adding
// an entry to the registry, not writing a new method.
Object.entries(RESPONSE_METHODS).forEach(([methodName, opts]) => {
  Response.prototype[methodName] = async function (...strings) {
    return await this._runWithMiddleware(methodName, opts, ...strings)
  }
})
