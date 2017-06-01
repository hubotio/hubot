'use strict'

class User {
  // Represents a participating user in the chat.
  //
  // id      - A unique ID for the user.
  // options - An optional Hash of key, value pairs for this user.
  constructor (id, options) {
    this.id = id
    if (options == null) {
      options = {}
    }
    for (let k in options || {}) {
      this[k] = options[k]
    }
    if (!this['name']) {
      this['name'] = this.id.toString()
    }
  }
}

module.exports = User
