'use strict'

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Robot, TextMessage, User } from '../index.mjs'
import stream from 'node:stream'
import fs from 'node:fs'
import { writeFile } from 'node:fs/promises'

describe('Shell history file test', () => {
  it.skip('History file is > 1024 bytes when running does not throw an error', async () => {
    const robot = new Robot('Shell', false, 'TestHubot')
    robot.stdin = new stream.Readable()
    robot.stdin._read = () => {}
    const __dirname = new URL('.', import.meta.url).pathname
    const historyPath = `${__dirname}/../.hubot_history`
    await writeFile(historyPath, 'a'.repeat(1025))
    await robot.loadAdapter()
    await robot.run()
    assert.ok(fs.existsSync(historyPath), 'History file should exist')
    try {
      const stats = fs.statSync(historyPath)
      assert.ok(stats.size <= 1024, 'History file should be less than or equal to 1024 bytes after running the robot')
    } catch (error) {
      assert.fail('Should not throw an error when reading history file')
    } finally {
      robot.shutdown()
    }
  })
})

describe('Shell Adapter Integration Test', () => {
  let robot = null
  beforeEach(async () => {
    robot = new Robot('Shell', false, 'TestHubot')
    robot.stdin = new stream.Readable()
    robot.stdin._read = () => {}
    await robot.loadAdapter()
    await robot.run()
  })
  afterEach(() => {
    robot.shutdown()
  })
  it('responds to a message that starts with the robot name', async () => {
    let wasCalled = false
    robot.respond(/helo/, async res => {
      wasCalled = true
      await res.reply('hello from the other side')
    })
    robot.stdin.push(robot.name + ' helo\n')
    robot.stdin.push(null)
    await new Promise(resolve => setTimeout(resolve, 60))
    assert.deepEqual(wasCalled, true)
  })
  it('responds to a message without starting with the robot name', async () => {
    let wasCalled = false
    robot.respond(/helo/, async res => {
      wasCalled = true
      await res.reply('hello from the other side')
    })
    robot.stdin.push('helo\n')
    robot.stdin.push(null)
    await new Promise(resolve => setTimeout(resolve, 60))
    assert.deepEqual(wasCalled, true)
  })
  it('shows prompt if nothing was entered', async () => {
    let wasCalled = false
    robot.respond(/\n/, async res => {
      wasCalled = true
      await res.reply('hello from the other side')
    })
    robot.stdin.push('\n')
    robot.stdin.push(null)
    await new Promise(resolve => setTimeout(resolve, 60))
    assert.deepEqual(wasCalled, false)
  })
})

describe('Shell Adapter', () => {
  let robot = null
  beforeEach(async () => {
    robot = new Robot('Shell', false, 'TestHubot')
    await robot.loadAdapter()
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
