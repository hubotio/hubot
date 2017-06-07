const { Adapter } = require('../..')

class MockAdapter extends Adapter {
  send (envelope, ...strings) { return this.emit('send', envelope, strings) }
  reply (envelope, ...strings) { return this.emit('reply', envelope, strings) }
  topic (envelope, ...strings) { return this.emit('topic', envelope, strings) }
  play (envelope, ...strings) { return this.emit('play', envelope, strings) }

  run () { return this.emit('connected') }
  close () { return this.emit('closed') }
}

module.exports.use = robot => new MockAdapter(robot)
