'use strict'
import Adapter from '../../src/adapter.mjs'

class MockAdapter extends Adapter {
  async send (envelope, ...strings) {
    this.emit('send', envelope, ...strings)
  }

  async reply (envelope, ...strings) {
    this.emit('reply', envelope, ...strings)
  }

  async topic (envelope, ...strings) {
    this.emit('topic', envelope, ...strings)
  }

  async play (envelope, ...strings) {
    this.emit('play', envelope, ...strings)
  }

  run () {
    this.emit('connected')
  }

  close () {
    this.emit('closed')
  }
}

export default (robot) => new MockAdapter(robot)
