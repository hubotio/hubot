'use strict'

import { Adapter } from '../../es2015.js' // eslint-disable-line import/no-unresolved

class MockAdapter extends Adapter {
  constructor (robot) {
    super(robot)
    this.name = 'MockAdapter'
  }

  send (envelope, ...strings) {
    this.emit('send', envelope, strings)
  }

  reply (envelope, ...strings) {
    this.emit('reply', envelope, strings)
  }

  topic (envelope, ...strings) {
    this.emit('topic', envelope, strings)
  }

  play (envelope, ...strings) {
    this.emit('play', envelope, strings)
  }

  run () {
    // This is required to get the scripts loaded
    this.emit('connected')
  }

  close () {
    this.emit('closed')
  }
}
export {
  MockAdapter
}
export default {
  use (robot) {
    return new MockAdapter(robot)
  }
}
