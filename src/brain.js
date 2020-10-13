'use strict'

const EventEmitter = require('events').EventEmitter

const User = require('./user')

// If necessary, reconstructs a User object. Returns either:
//
// 1. If the original object was falsy, null
// 2. If the original object was a User object, the original object
// 3. If the original object was a plain JavaScript object, return
//    a User object with all of the original object's properties.
let reconstructUserIfNecessary = function (user, robot) {
  if (!user) {
    return null
  }

  if (!user.constructor || (user.constructor && user.constructor.name !== 'User')) {
    let id = user.id
    delete user.id
    // Use the old user as the "options" object,
    // populating the new user with its values.
    // Also add the `robot` field so it gets a reference.
    user.robot = robot
    let newUser = new User(id, user)
    delete user.robot

    return newUser
  } else {
    return user
  }
}

class Brain extends EventEmitter {
  // Represents somewhat persistent storage for the robot. Extend this.
  //
  // Returns a new Brain with no external storage.
  constructor (robot) {
    super()
    this.data = {
      users: {},
      _private: {}
    }
    this.getRobot = function () {
      return robot
    }

    this.autoSave = true

    robot.on('running', () => {
      this.resetSaveInterval(5)
    })
  }

  // Public: Store key-value pair under the private namespace and extend
  // existing @data before emitting the 'loaded' event.
  //
  // Returns the instance for chaining.
  set (key, value) {
    let pair
    if (key === Object(key)) {
      pair = key
    } else {
      pair = {}
      pair[key] = value
    }

    Object.keys(pair).forEach((key) => {
      this.data._private[key] = pair[key]
    })

    this.emit('loaded', this.data)

    return this
  }

  // Public: Get value by key from the private namespace in @data
  // or return null if not found.
  //
  // Returns the value.
  get (key) {
    return this.data._private[key] != null ? this.data._private[key] : null
  }

  // Public: Remove value by key from the private namespace in @data
  // if it exists
  //
  // Returns the instance for chaining.
  remove (key) {
    if (this.data._private[key] != null) {
      delete this.data._private[key]
    }

    return this
  }

  // Public: Emits the 'save' event so that 'brain' scripts can handle
  // persisting.
  //
  // Returns nothing.
  save () {
    this.emit('save', this.data)
  }

  // Public: Emits the 'close' event so that 'brain' scripts can handle closing.
  //
  // Returns nothing.
  close () {
    clearInterval(this.saveInterval)
    this.save()
    this.emit('close')
  }

  // Public: Enable or disable the automatic saving
  //
  // enabled - A boolean whether to autosave or not
  //
  // Returns nothing
  setAutoSave (enabled) {
    this.autoSave = enabled
  }

  // Public: Reset the interval between save function calls.
  //
  // seconds - An Integer of seconds between saves.
  //
  // Returns nothing.
  resetSaveInterval (seconds) {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
    }
    this.saveInterval = setInterval(() => {
      if (this.autoSave) {
        this.save()
      }
    }, seconds * 1000)
  }

  // Public: Merge keys loaded from a DB against the in memory representation.
  //
  // Returns nothing.
  //
  // Caveats: Deeply nested structures don't merge well.
  mergeData (data) {
    for (let k in data || {}) {
      this.data[k] = data[k]
    }

    // Ensure users in the brain are still User objects.
    if (data && data.users) {
      for (let k in data.users) {
        let user = this.data.users[k]
        this.data.users[k] = reconstructUserIfNecessary(user, this.getRobot())
      }
    }

    this.emit('loaded', this.data)
  }

  // Public: Get an Array of User objects stored in the brain.
  //
  // Returns an Array of User objects.
  users () {
    return this.data.users
  }

  // Public: Get a User object given a unique identifier.
  //
  // Returns a User instance of the specified user.
  userForId (id, options) {
    let user = this.data.users[id]
    if (!options) {
      options = {}
    }
    options.robot = this.getRobot()

    if (!user) {
      user = new User(id, options)
      this.data.users[id] = user
    }

    if (options && options.room && (!user.room || user.room !== options.room)) {
      user = new User(id, options)
      this.data.users[id] = user
    }
    delete options.robot

    return user
  }

  // Public: Get a User object given a name.
  //
  // Returns a User instance for the user with the specified name.
  userForName (name) {
    let result = null
    const lowerName = name.toLowerCase()

    for (let k in this.data.users || {}) {
      const userName = this.data.users[k]['name']
      if (userName != null && userName.toString().toLowerCase() === lowerName) {
        result = this.data.users[k]
      }
    }

    return result
  }

  // Public: Get all users whose names match fuzzyName. Currently, match
  // means 'starts with', but this could be extended to match initials,
  // nicknames, etc.
  //
  // Returns an Array of User instances matching the fuzzy name.
  usersForRawFuzzyName (fuzzyName) {
    const lowerFuzzyName = fuzzyName.toLowerCase()

    const users = this.data.users || {}

    return Object.keys(users).reduce((result, key) => {
      const user = users[key]
      if (user.name.toLowerCase().lastIndexOf(lowerFuzzyName, 0) === 0) {
        result.push(user)
      }
      return result
    }, [])
  }

  // Public: If fuzzyName is an exact match for a user, returns an array with
  // just that user. Otherwise, returns an array of all users for which
  // fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
  //
  // Returns an Array of User instances matching the fuzzy name.
  usersForFuzzyName (fuzzyName) {
    const matchedUsers = this.usersForRawFuzzyName(fuzzyName)
    const lowerFuzzyName = fuzzyName.toLowerCase()
    const fuzzyMatchedUsers = matchedUsers.filter(user => user.name.toLowerCase() === lowerFuzzyName)

    return fuzzyMatchedUsers.length > 0 ? fuzzyMatchedUsers : matchedUsers
  }
}

module.exports = Brain
