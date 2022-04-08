'use strict'
import {DataStoreUnavailable} from './datastore.mjs'

class User {
  // Represents a participating user in the chat.
  //
  // id      - A unique ID for the user.
  // options - An optional Hash of key, value pairs for this user.
  constructor (id, options = {}) {
    this.id = id

    // Define a getter method so we don't actually store the
    // robot itself on the user object, preventing it from
    // being serialized into the brain.
    const robot = options.robot ?? {}
    delete options.robot
    Reflect.defineProperty(this, 'robot', {
      get () { return robot }
    })

    Object.keys(options).forEach((key) => {
      this[key] = options[key]
    })

    if (!this.name) {
      this.name = this.id.toString()
    }
  }

  set (key, value) {
    this.#checkDatastoreAvailable()
    return this.#getDatastore()._set(this.#constructKey(key), value, 'users')
  }

  get (key) {
    this.#checkDatastoreAvailable()
    return this.#getDatastore()._get(this.#constructKey(key), 'users')
  }

  #constructKey (key) {
    return `${this.id}+${key}`
  }

  #checkDatastoreAvailable () {
    if (!this.#getDatastore()) {
      throw new DataStoreUnavailable('datastore is not initialized')
    }
  }

  #getDatastore () {
    if (this.robot) {
      return this.robot.datastore
    }
  }
}

export default User
