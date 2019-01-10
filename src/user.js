'use strict'

const DataStoreUnavailable = require('./datastore').DataStoreUnavailable

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

    // Define a getter method so we don't actually store the
    // robot itself on the user object, preventing it from
    // being serialized into the brain.
    if (options.robot) {
      let robot = options.robot
      delete options.robot
      this._getRobot = function () { return robot }
    } else {
      this._getRobot = function () { }
    }

    Object.keys(options).forEach((key) => {
      this[key] = options[key]
    })

    if (!this.name) {
      this.name = this.id.toString()
    }
  }

  set (key, value) {
    this._checkDatastoreAvailable()
    return this._getDatastore()._set(this._constructKey(key), value, 'users')
  }

  get (key) {
    this._checkDatastoreAvailable()
    return this._getDatastore()._get(this._constructKey(key), 'users')
  }

  _constructKey (key) {
    return `${this.id}+${key}`
  }

  _checkDatastoreAvailable () {
    if (!this._getDatastore()) {
      throw new DataStoreUnavailable('datastore is not initialized')
    }
  }

  _getDatastore () {
    let robot = this._getRobot()
    if (robot) {
      return robot.datastore
    }
  }
}

module.exports = User
