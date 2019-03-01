'use strict'

const DataStore = require('../datastore').DataStore

class InMemoryDataStore extends DataStore {
  constructor (robot) {
    super(robot)
    this.data = {
      global: {},
      users: {}
    }
  }

  _get (key, table) {
    return Promise.resolve(this.data[table][key])
  }

  _set (key, value, table) {
    return Promise.resolve(this.data[table][key] = value)
  }
}

module.exports = InMemoryDataStore
