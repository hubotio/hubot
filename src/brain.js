'use strict'

const EventEmitter = require('events').EventEmitter

const User = require('./user')

class Brain extends EventEmitter {
  // Represents somewhat persistent storage for the robot. Extend this.
  //
  // Returns a new Brain with no external storage.
  constructor (robot) {
    super(robot)
    this.data = {
      users: {},
      _private: {}
    }

    this.autoSave = true

    robot.on('running', () => {
      return this.resetSaveInterval(5)
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

    extend(this.data._private, pair)
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
    return this.emit('save', this.data)
  }

  // Public: Emits the 'close' event so that 'brain' scripts can handle closing.
  //
  // Returns nothing.
  close () {
    clearInterval(this.saveInterval)
    this.save()
    return this.emit('close')
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
        return this.save()
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
    if (!user) {
      user = new User(id, options)
      this.data.users[id] = user
    }

    if (options && options.room && (!user.room || user.room !== options.room)) {
      user = new User(id, options)
      this.data.users[id] = user
    }

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
    return (() => {
      const result = []
      const object = this.data.users || {}
      for (let key in object) {
        const user = object[key]
        if (user.name.toLowerCase().lastIndexOf(lowerFuzzyName, 0) === 0) {
          result.push(user)
        }
      }
      return result
    })()
  }

  // Public: If fuzzyName is an exact match for a user, returns an array with
  // just that user. Otherwise, returns an array of all users for which
  // fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
  //
  // Returns an Array of User instances matching the fuzzy name.
  usersForFuzzyName (fuzzyName) {
    const matchedUsers = this.usersForRawFuzzyName(fuzzyName)
    const lowerFuzzyName = fuzzyName.toLowerCase()
    var _iteratorNormalCompletion = true
    var _didIteratorError = false
    var _iteratorError

    try {
      for (var _iterator = Array.from(matchedUsers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let user = _step.value

        if (user.name.toLowerCase() === lowerFuzzyName) {
          return [user]
        }
      }
    } catch (err) {
      _didIteratorError = true
      _iteratorError = err
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return()
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError
        }
      }
    }

    return matchedUsers
  }
}

// Private: Extend obj with objects passed as additional args.
//
// Returns the original object with updated changes.
var extend = function extend (obj, ...sources) {
  var _iteratorNormalCompletion2 = true
  var _didIteratorError2 = false
  var _iteratorError2

  try {
    for (var _iterator2 = Array.from(sources)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      let source = _step2.value
      var _iteratorNormalCompletion3 = true
      var _didIteratorError3 = false
      var _iteratorError3

      try {
        for (var _iterator3 = Object.keys(source || {})[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          let key = _step3.value
          const value = source[key]; obj[key] = value
        }
      } catch (err) {
        _didIteratorError3 = true
        _iteratorError3 = err
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return()
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError2 = true
    _iteratorError2 = err
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return()
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2
      }
    }
  }

  return obj
}

module.exports = Brain
