'use strict'

const DataStore = require('../datastore.js').DataStore

class InMemoryDataStore extends DataStore {
  constructor (robot) {
    super(robot)
    this.data = {
      global: {},
      users: {}
    }
  }

  async _get (key, table) {
    return Promise.resolve(this.data[table][key])
  }

  async _set (key, value, table) {
    return Promise.resolve(this.data[table][key] = value)
  }
}

module.exports = InMemoryDataStore
