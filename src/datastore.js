'use strict'

class DataStore {
  // Represents a persistent, database-backed storage for the robot. Extend this.
  //
  // Returns a new Datastore with no storage.
  constructor (robot) {
    this.robot = robot
  }

  // Public: Set value for key in the database. Overwrites existing
  // values if present. Returns a promise which resolves when the
  // write has completed.
  //
  // Value can be any JSON-serializable type.
  set (key, value) {
    return this._set(key, value, 'global')
  }

  // Public: Assuming `key` represents an object in the database,
  // sets its `objectKey` to `value`. If `key` isn't already
  // present, it's instantiated as an empty object.
  setObject (key, objectKey, value) {
    return this.get(key).then((object) => {
      let target = object || {}
      target[objectKey] = value
      return this.set(key, target)
    })
  }

  // Public: Adds the supplied value(s) to the end of the existing
  // array in the database marked by `key`. If `key` isn't already
  // present, it's instantiated as an empty array.
  setArray (key, value) {
    return this.get(key).then((object) => {
      let target = object || []
      // Extend the array if the value is also an array, otherwise
      // push the single value on the end.
      if (Array.isArray(value)) {
        return this.set(key, target.push.apply(target, value))
      } else {
        return this.set(key, target.concat(value))
      }
    })
  }

  // Public: Get value by key if in the database or return `undefined`
  // if not found. Returns a promise which resolves to the
  // requested value.
  get (key) {
    return this._get(key, 'global')
  }

  // Public: Digs inside the object at `key` for a key named
  // `objectKey`. If `key` isn't already present, or if it doesn't
  // contain an `objectKey`, returns `undefined`.
  getObject (key, objectKey) {
    return this.get(key).then((object) => {
      let target = object || {}
      return target[objectKey]
    })
  }

  // Private: Implements the underlying `set` logic for the datastore.
  // This will be called by the public methods. This is one of two
  // methods that must be implemented by subclasses of this class.
  // `table` represents a unique namespace for this key, such as a
  // table in a SQL database.
  //
  // This returns a resolved promise when the `set` operation is
  // successful, and a rejected promise if the operation fails.
  _set (key, value, table) {
    return Promise.reject(new DataStoreUnavailable('Setter called on the abstract class.'))
  }

  // Private: Implements the underlying `get` logic for the datastore.
  // This will be called by the public methods. This is one of two
  // methods that must be implemented by subclasses of this class.
  // `table` represents a unique namespace for this key, such as a
  // table in a SQL database.
  //
  // This returns a resolved promise containing the fetched value on
  // success, and a rejected promise if the operation fails.
  _get (key, table) {
    return Promise.reject(new DataStoreUnavailable('Getter called on the abstract class.'))
  }
}

class DataStoreUnavailable extends Error {}

module.exports = {
  DataStore,
  DataStoreUnavailable
}
