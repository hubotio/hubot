'use strict'

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Robot, TextMessage, User } from '../index.mjs'

describe('Shell Adapter', () => {
  let robot = null
  beforeEach(async () => {
    robot = new Robot('Shell', false, 'TestHubot')
    await robot.loadAdapter()
  })

  describe('Public API', () => {
    let adapter = null
    beforeEach(() => {
      adapter = robot.adapter
    })

    it('assigns robot', () => {
      assert.deepEqual(adapter.robot, robot, 'The adapter should have a reference to the robot.')
    })

    it('sends a message', async () => {
      const old = console.log
      let wasCalled = false
      console.log = (...args) => {
        console.log = old
        assert.deepEqual(args[0], '\x1b[1mhello\x1b[22m', 'Message should be outputed as bold to the console.')
        wasCalled = true
      }
      await adapter.send({ room: 'general' }, 'hello')
      assert.deepEqual(wasCalled, true)
    })

    it('emotes a message', async () => {
      const old = console.log
      let wasCalled = false
      console.log = (...args) => {
        console.log = old
        assert.deepEqual(args[0], '\x1b[1m* hello\x1b[22m', 'Message should be bold and have an * in front.')
        wasCalled = true
      }
      await adapter.emote({ room: 'general' }, 'hello')
      assert.deepEqual(wasCalled, true)
    })

    it('replies to a message', async () => {
      const old = console.log
      let wasCalled = false
      console.log = (...args) => {
        console.log = old
        assert.deepEqual(args[0], '\x1b[1mnode: hello\x1b[22m', 'The strings should be passed through.')
        wasCalled = true
      }
      await adapter.reply({ room: 'general', user: { name: 'node' } }, 'hello')
      assert.deepEqual(wasCalled, true)
    })

    it('runs the adapter and emits connected', async () => {
      let wasCalled = false
      const connected = () => {
        adapter.off('connected', connected)
        assert.ok(true, 'The connected event should be emitted.')
        wasCalled = true
      }
      adapter.on('connected', connected)
      await adapter.run()
      assert.deepEqual(wasCalled, true)
      robot.shutdown()
    })

    it('dispatches received messages to the robot', async () => {
      const message = new TextMessage(new User('node'), 'hello', 1)
      let wasCalled = false
      robot.receive = (msg) => {
        assert.deepEqual(msg, message, 'The message should be passed through.')
        wasCalled = true
      }
      await adapter.receive(message)
      assert.deepEqual(wasCalled, true)
    })
  })
})
