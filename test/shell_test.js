'use strict'

const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('assert/strict')

const Robot = require('../src/robot')
const { TextMessage } = require('../src/message.js')
const User = require('../src/user.js')

describe('Shell Adapter', () => {
  let robot = null
  beforeEach(async () => {
    robot = new Robot('shell', false, 'TestHubot')
    await robot.loadAdapter()
    robot.run()
  })

  afterEach(() => {
    robot.shutdown()
  })

  describe('Public API', () => {
    let adapter = null
    beforeEach(() => {
      adapter = robot.adapter
    })

    it('assigns robot', () => {
      assert.deepEqual(adapter.robot, robot, 'The adapter should have a reference to the robot.')
    })

    it('sends a message', (t, done) => {
      const old = console.log
      console.log = (...args) => {
        console.log = old
        assert.deepEqual(args[0], '\x1b[1mhello\x1b[22m', 'Message should be outputed as bold to the console.')
        done()
      }
      adapter.send({ room: 'general' }, 'hello')
    })

    it('emotes a message', (t, done) => {
      const old = console.log
      console.log = (...args) => {
        console.log = old
        assert.deepEqual(args[0], '\x1b[1m* hello\x1b[22m', 'Message should be bold and have an * in front.')
        done()
      }
      adapter.emote({ room: 'general' }, 'hello')
    })

    it('replies to a message', (t, done) => {
      const old = console.log
      console.log = (...args) => {
        console.log = old
        assert.deepEqual(args[0], '\x1b[1mnode: hello\x1b[22m', 'The strings should be passed through.')
        done()
      }
      adapter.reply({ room: 'general', user: { name: 'node' } }, 'hello')
    })

    it('runs the adapter and emits connected', (t, done) => {
      const connected = () => {
        adapter.off('connected', connected)
        done()
      }
      adapter.on('connected', connected)
      adapter.run()
    })

    it('dispatches received messages to the robot', (t, done) => {
      const message = new TextMessage(new User('node'), 'hello', 1)
      robot.receive = (msg) => {
        assert.deepEqual(msg, message, 'The message should be passed through.')
        done()
      }
      adapter.receive(message)
    })
  })
})
