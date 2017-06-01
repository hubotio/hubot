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
      user: this.message.user,
      message: this.message
    }
  }

  // Public: Posts a message back to the chat source
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns nothing.
  send (...strings) {
    return this.runWithMiddleware('send', { plaintext: true }, ...Array.from(strings))
  }

  // Public: Posts an emote back to the chat source
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns nothing.
  emote (...strings) {
    return this.runWithMiddleware('emote', { plaintext: true }, ...Array.from(strings))
  }

  // Public: Posts a message mentioning the current user.
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns nothing.
  reply (...strings) {
    return this.runWithMiddleware('reply', { plaintext: true }, ...Array.from(strings))
  }

  // Public: Posts a topic changing message
  //
  // strings - One or more strings to set as the topic of the
  //           room the bot is in.
  //
  // Returns nothing.
  topic (...strings) {
    return this.runWithMiddleware('topic', { plaintext: true }, ...Array.from(strings))
  }

  // Public: Play a sound in the chat source
  //
  // strings - One or more strings to be posted as sounds to play. The order of
  //           these strings should be kept intact.
  //
  // Returns nothing
  play (...strings) {
    return this.runWithMiddleware('play', ...Array.from(strings))
  }

  // Public: Posts a message in an unlogged room
  //
  // strings - One or more strings to be posted. The order of these strings
  //           should be kept intact.
  //
  // Returns nothing
  locked (...strings) {
    return this.runWithMiddleware('locked', { plaintext: true }, ...Array.from(strings))
  }

  // Private: Call with a method for the given strings using response
  // middleware.
  runWithMiddleware (methodName, opts, ...strings) {
    let callback
    const copy = strings.slice(0)
    if (typeof copy[copy.length - 1] === 'function') {
      callback = copy.pop()
    }
    const context = { response: this, strings: copy, method: methodName }
    if (opts.plaintext != null) {
      context.plaintext = true
    }
    const responseMiddlewareDone = function responseMiddlewareDone () {}
    const runAdapterSend = (_, done) => {
      const result = context.strings
      if (callback != null) {
        result.push(callback)
      }
      this.robot.adapter[methodName](this.envelope, ...Array.from(result))
      return done()
    }
    return this.robot.middleware.response.execute(context, runAdapterSend, responseMiddlewareDone)
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
    return this.message.finish()
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
