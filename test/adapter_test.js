'use strict'
const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('assert/strict')
const Adapter = require('../src/adapter')
const { TextMessage } = require('../src/message.js')
const User = require('../src/user.js')

describe('Adapter', () => {
  let robot = null
  beforeEach(() => {
    robot = { receive (msg) {} }
  })

  describe('Public API', () => {
    let adapter = null
    beforeEach(() => {
      adapter = new Adapter(robot)
    })
    afterEach(() => {
      adapter.close()
      process.removeAllListeners()
    })

    it('assigns robot', () => {
      assert.deepEqual(adapter.robot, robot, 'The adapter should have a reference to the robot.')
    })

    describe('send', () => {
      it('is a function', () => {
        assert.ok(typeof adapter.send === 'function', 'The adapter should have a send method.')
      })

      it('does nothing', () => {
        adapter.send({}, 'nothing')
      })
    })

    describe('reply', () => {
      it('is a function', () => {
        assert.ok(typeof adapter.reply === 'function', 'The adapter should have a reply method.')
      })

      it('does nothing', () => {
        adapter.reply({}, 'nothing')
      })
    })
    describe('emote', () => {
      it('is a function', () => {
        assert.ok(typeof adapter.emote === 'function', 'The adapter should have a emote method.')
      })

      it('does nothing', () => {
        adapter.emote({}, 'nothing')
      })
    })
    describe('topic', () => {
      it('is a function', () => {
        assert.ok(typeof adapter.topic === 'function', 'The adapter should have a topic method.')
      })

      it('does nothing', () => {
        adapter.topic({}, 'nothing')
      })
    })

    describe('play', () => {
      it('is a function', () => {
        assert.ok(typeof adapter.play === 'function', 'The adapter should have a play method.')
      })

      it('does nothing', () => {
        adapter.play({}, 'nothing')
      })
    })

    describe('run', () => {
      it('is a function', () => {
        assert.ok(typeof adapter.run === 'function', 'The adapter should have a run method.')
      })

      it('does nothing', () => {
        adapter.run()
      })
    })

    describe('close', () => {
      it('is a function', () => {
        assert.ok(typeof adapter.close === 'function', 'The adapter should have a close method.')
      })

      it('does nothing', () => {
        adapter.close()
      })
    })
  })

  it('dispatches received messages to the robot', (t, done) => {
    const adapter = new Adapter(robot)
    const message = new TextMessage(new User('node'), 'hello', 1)
    robot.receive = (msg) => {
      assert.deepEqual(msg, message, 'The message should be passed through.')
      done()
    }
    adapter.receive(message)
    adapter.close()
  })
})
