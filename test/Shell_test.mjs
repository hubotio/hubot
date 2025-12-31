'use strict'

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Robot, TextMessage, User } from '../index.mjs'
import stream from 'node:stream'
import { writeFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

describe('Shell history file test', () => {
  it('History file is > 1024 bytes when running does not throw an error', async () => {
    const robot = new Robot('Shell', false, 'TestHubot')
    robot.stdin = new stream.Readable()
    robot.stdin._read = () => {}
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const historyPath = path.join(__dirname, '..', '.hubot_history')
    await writeFile(historyPath, 'a'.repeat(1025))
    await robot.loadAdapter()
    await robot.run()
    try {
      const fileInfo = await stat(historyPath)
      assert.ok(fileInfo.size <= 1024, 'History file should be less than or equal to 1024 bytes after running the robot')
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
    robot.stdin = new stream.Readable()
    robot.stdin._read = () => {}
    await robot.loadAdapter()
    await robot.run()
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

describe('Shell Adapter: Print human readable logging in the console when something is logged with robot.logger', async () => {
  it('setting HUBOT_LOG_LEVEL to debug prints debug and info log messages to the console', async () => {
    process.env.HUBOT_LOG_LEVEL = 'debug'
    const robot = new Robot('Shell', false, 'TestHubot')
    await robot.loadAdapter()
    await robot.run()

    const old = console.log
    const expected = {
      debug: false,
      info: false
    }
    console.log = (...args) => {
      old(...args)
      switch (true) {
        case args[0].includes('[debug]'):
          expected.debug = true
          break
        case args[0].includes('[info]'):
          expected.info = true
          break
      }
    }
    robot.logger.debug('should print debug message to console')
    robot.logger.info('should print info message to console')
    delete process.env.HUBOT_LOG_LEVEL
    console.log = old
    assert.deepEqual(expected, { debug: true, info: true })
    robot.shutdown()
  })

  it('setting HUBOT_LOG_LEVEL to error only prints error log messages to the console', async () => {
    process.env.HUBOT_LOG_LEVEL = 'error'
    const robot = new Robot('Shell', false, 'TestHubot')
    await robot.loadAdapter()
    await robot.run()

    const old = console.log
    const expected = {
      debug: false,
      info: false,
      error: false
    }
    console.log = (...args) => {
      old(...args)
      switch (true) {
        case args[0].includes('[debug]'):
          expected.debug = true
          break
        case args[0].includes('[info]'):
          expected.info = true
          break
        case args[0].includes('[error]'):
          expected.error = true
          break
      }
    }
    robot.logger.debug('should NOT print debug message to console')
    robot.logger.info('should NOT print info message to console')
    robot.logger.error('should print error message to console')
    delete process.env.HUBOT_LOG_LEVEL
    console.log = old
    assert.deepEqual(expected, { debug: false, info: false, error: true })
    robot.shutdown()
  })
})

describe('Shell Adapter: Logger before adapter run', () => {
  it('does not throw when logging before the adapter initializes readline', async () => {
    const robot = new Robot('Shell', false, 'TestHubot')
    robot.stdin = new stream.Readable()
    robot.stdin._read = () => {}

    const originalLog = console.log
    const logMessages = []
    console.log = (...args) => {
      logMessages.push(args[0])
    }

    try {
      await assert.doesNotReject(async () => {
        // Before loadAdapter - uses default pino logger
        robot.logger.info('log before adapter load')

        await robot.loadAdapter()

        // After loadAdapter but before run - still uses pino logger (logger override happens in run())
        await robot.logger.info('log after load before run')

        await robot.run()

        // After run - uses Shell adapter's custom logger with formatted output
        await robot.logger.info('log after run')
      })

      // Verify that logging after run() uses the Shell adapter's custom formatted logger
      assert.ok(logMessages.some(msg => typeof msg === 'string' && msg.includes('[info]') && msg.includes('log after run')),
        'Should use Shell adapter formatted logger after run()')
    } finally {
      console.log = originalLog
      robot.shutdown()
    }
  })
})
