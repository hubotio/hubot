'use strict'

const EventEmitter = require('events').EventEmitter

class Adapter extends EventEmitter {
  // An adapter is a specific interface to a chat source for robots.
  //
  // robot - A Robot instance.
  constructor (robot) {
    super()
    this.robot = robot
  }

  // Public: Raw method for sending data back to the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns nothing.
  send (envelope/* , ...strings */) {}

  // Public: Raw method for sending emote data back to the chat source.
  // Defaults as an alias for send
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns nothing.
  emote (envelope/* , ...strings */) {
    const strings = [].slice.call(arguments, 1)
    return this.send.apply(this, [envelope].concat(strings))
  }

  // Public: Raw method for building a reply and sending it back to the chat
  // source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each reply to send.
  //
  // Returns nothing.
  reply (envelope/* , ...strings */) {}

  // Public: Raw method for setting a topic on the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One more more Strings to set as the topic.
  //
  // Returns nothing.
  topic (envelope/* , ...strings */) {}

  // Public: Raw method for playing a sound in the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more strings for each play message to send.
  //
  // Returns nothing
  play (envelope/* , ...strings */) {}

  // Public: Raw method for invoking the bot to run. Extend this.
  //
  // Returns nothing.
  run () {}

  // Public: Raw method for shutting the bot down. Extend this.
  //
  // Returns nothing.
  close () {}

  // Public: Dispatch a received message to the robot.
  //
  // Returns nothing.
  receive (message) {
    this.robot.receive(message)
  }

  // Public: Get an Array of User objects stored in the brain.
  //
  // Returns an Array of User objects.
  users () {
    this.robot.logger.warning('@users() is going to be deprecated in 3.0.0 use @robot.brain.users()')
    return this.robot.brain.users()
  }

  // Public: Get a User object given a unique identifier.
  //
  // Returns a User instance of the specified user.
  userForId (id, options) {
    this.robot.logger.warning('@userForId() is going to be deprecated in 3.0.0 use @robot.brain.userForId()')
    return this.robot.brain.userForId(id, options)
  }

  // Public: Get a User object given a name.
  //
  // Returns a User instance for the user with the specified name.
  userForName (name) {
    this.robot.logger.warning('@userForName() is going to be deprecated in 3.0.0 use @robot.brain.userForName()')
    return this.robot.brain.userForName(name)
  }

  // Public: Get all users whose names match fuzzyName. Currently, match
  // means 'starts with', but this could be extended to match initials,
  // nicknames, etc.
  //
  // Returns an Array of User instances matching the fuzzy name.
  usersForRawFuzzyName (fuzzyName) {
    this.robot.logger.warning('@userForRawFuzzyName() is going to be deprecated in 3.0.0 use @robot.brain.userForRawFuzzyName()')
    return this.robot.brain.usersForRawFuzzyName(fuzzyName)
  }

  // Public: If fuzzyName is an exact match for a user, returns an array with
  // just that user. Otherwise, returns an array of all users for which
  // fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
  //
  // Returns an Array of User instances matching the fuzzy name.
  usersForFuzzyName (fuzzyName) {
    this.robot.logger.warning('@userForFuzzyName() is going to be deprecated in 3.0.0 use @robot.brain.userForFuzzyName()')
    return this.robot.brain.usersForFuzzyName(fuzzyName)
  }

  // Public: Creates a scoped http client with chainable methods for
  // modifying the request. This doesn't actually make a request though.
  // Once your request is assembled, you can call `get()`/`post()`/etc to
  // send the request.
  //
  // Returns a ScopedClient instance.
  http (url) {
    this.robot.logger.warning('@http() is going to be deprecated in 3.0.0 use @robot.http()')
    return this.robot.http(url)
  }
}

module.exports = Adapter
