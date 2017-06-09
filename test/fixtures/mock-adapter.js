'use strict'

const Adapter = require('../..').Adapter

class MockAdapter extends Adapter {
  send (envelope/* , ...strings */) {
    const strings = [].slice.call(arguments, 1)
    this.emit('send', envelope, strings)
  }
  reply (envelope/* , ...strings */) {
    const strings = [].slice.call(arguments, 1)
    this.emit('reply', envelope, strings)
  }
  topic (envelope/* , ...strings */) {
    const strings = [].slice.call(arguments, 1)
    this.emit('topic', envelope, strings)
  }
  play (envelope/* , ...strings */) {
    const strings = [].slice.call(arguments, 1)
    this.emit('play', envelope, strings)
  }
  run () {
    this.emit('connected')
  }
  close () {
    this.emit('closed')
  }
}

module.exports.use = robot => new MockAdapter(robot)
