'use strict'

import { DataStore } from '../DataStore.mjs'

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

export default InMemoryDataStore
