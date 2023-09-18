'use strict'

/* eslint-disable no-unused-expressions */
require('coffeescript/register.js')
const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('assert/strict')

// Hubot classes
const Robot = require('../src/robot.js')
const CatchAllMessage = require('../src/message.js').CatchAllMessage
const EnterMessage = require('../src/message.js').EnterMessage
const LeaveMessage = require('../src/message.js').LeaveMessage
const TextMessage = require('../src/message.js').TextMessage
const TopicMessage = require('../src/message.js').TopicMessage
const User = require('../src/user.js')
const path = require('path')
const { hook, reset } = require('./fixtures/RequireMocker.js')
const mockAdapter = require('./fixtures/mock-adapter.js')
describe('Robot', () => {
  describe('#http', () => {
    let robot = null
    beforeEach(() => {
      robot = new Robot(null, false, 'TestHubot')
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('API', () => {
      const agent = {}
      const httpClient = robot.http('http://example.com', { agent })
      assert.ok(httpClient.get)
      assert.ok(httpClient.post)
    })
    it('passes options through to the ScopedHttpClient', () => {
      const agent = {}
      const httpClient = robot.http('http://example.com', { agent })
      assert.deepEqual(httpClient.options.agent, agent)
    })
    it('sets a user agent', () => {
      const httpClient = robot.http('http://example.com')
      assert.ok(httpClient.options.headers['User-Agent'].indexOf('Hubot') > -1)
    })
    it('meges global http options', () => {
      const agent = {}
      robot.globalHttpOptions = { agent }
      const httpClient = robot.http('http://localhost')
      assert.deepEqual(httpClient.options.agent, agent)
    })
    it('local options override global http options', () => {
      const agentA = {}
      const agentB = {}
      robot.globalHttpOptions = { agent: agentA }
      const httpClient = robot.http('http://localhost', { agent: agentB })
      assert.deepEqual(httpClient.options.agent, agentB)
    })
    it('builds the url correctly from a string', () => {
      const httpClient = robot.http('http://localhost')
      const options = httpClient.buildOptions('http://localhost:3001')
      assert.equal(options.host, 'localhost:3001')
      assert.equal(options.pathname, '/')
      assert.equal(options.protocol, 'http:')
      assert.equal(options.port, '3001')
    })
  })

  describe('#respondPattern', () => {
    let robot = null
    beforeEach(() => {
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot', 't-bot')
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('matches messages starting with robot\'s name', () => {
      const testMessage = robot.name + 'message123'
      const testRegex = /(.*)/

      const pattern = robot.respondPattern(testRegex)
      assert.match(testMessage, pattern)
      const match = testMessage.match(pattern)[1]
      assert.equal(match, 'message123')
    })
    it("matches messages starting with robot's alias", () => {
      const testMessage = robot.alias + 'message123'
      const testRegex = /(.*)/

      const pattern = robot.respondPattern(testRegex)
      assert.match(testMessage, pattern)
      const match = testMessage.match(pattern)[1]
      assert.equal(match, 'message123')
    })

    it('does not match unaddressed messages', () => {
      const testMessage = 'message123'
      const testRegex = /(.*)/

      const pattern = robot.respondPattern(testRegex)
      assert.doesNotMatch(testMessage, pattern)
    })

    it('matches properly when name is substring of alias', () => {
      robot.name = 'Meg'
      robot.alias = 'Megan'
      const testMessage1 = robot.name + ' message123'
      const testMessage2 = robot.alias + ' message123'
      const testRegex = /(.*)/

      const pattern = robot.respondPattern(testRegex)

      assert.match(testMessage1, pattern)
      const match1 = testMessage1.match(pattern)[1]
      assert.equal(match1, 'message123')

      assert.match(testMessage2, pattern)
      const match2 = testMessage2.match(pattern)[1]
      assert.equal(match2, 'message123')
    })

    it('matches properly when alias is substring of name', () => {
      robot.name = 'Megan'
      robot.alias = 'Meg'
      const testMessage1 = robot.name + ' message123'
      const testMessage2 = robot.alias + ' message123'
      const testRegex = /(.*)/

      const pattern = robot.respondPattern(testRegex)

      assert.match(testMessage1, pattern)
      const match1 = testMessage1.match(pattern)[1]
      assert.equal(match1, 'message123')

      assert.match(testMessage2, pattern)
      const match2 = testMessage2.match(pattern)[1]
      assert.equal(match2, 'message123')
    })
  })
  describe('Listening API', () => {
    let robot = null
    beforeEach(() => {
      robot = new Robot(null, false, 'TestHubot')
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('#listen: registers a new listener directly', () => {
      assert.equal(robot.listeners.length, 0)
      robot.listen(() => {}, () => {})
      assert.equal(robot.listeners.length, 1)
    })

    it('#hear: registers a new listener directly', () => {
      assert.equal(robot.listeners.length, 0)
      robot.hear(/.*/, () => {})
      assert.equal(robot.listeners.length, 1)
    })

    it('#respond: registers a new listener using respond', () => {
      assert.equal(robot.listeners.length, 0)
      robot.respond(/.*/, () => {})
      assert.equal(robot.listeners.length, 1)
    })

    it('#enter: registers a new listener using listen', () => {
      assert.equal(robot.listeners.length, 0)
      robot.enter(() => {})
      assert.equal(robot.listeners.length, 1)
    })

    it('#leave: registers a new listener using listen', () => {
      assert.equal(robot.listeners.length, 0)
      robot.leave(() => {})
      assert.equal(robot.listeners.length, 1)
    })
    it('#topic: registers a new listener using listen', () => {
      assert.equal(robot.listeners.length, 0)
      robot.topic(() => {})
      assert.equal(robot.listeners.length, 1)
    })

    it('#catchAll: registers a new listener using listen', () => {
      assert.equal(robot.listeners.length, 0)
      robot.catchAll(() => {})
      assert.equal(robot.listeners.length, 1)
    })
  })
  describe('#receive', () => {
    let robot = null
    let user = null
    beforeEach(() => {
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
      user = new User('1', { name: 'node', room: '#test' })
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('calls all registered listeners', async () => {
      // Need to use a real Message so that the CatchAllMessage constructor works
      const testMessage = new TextMessage(user, 'message123')
      let counter = 0
      const listener = async message => {
        counter++
      }
      robot.listen(() => true, null, listener)
      robot.listen(() => true, null, listener)
      robot.listen(() => true, null, listener)
      robot.listen(() => true, null, listener)
      await robot.receive(testMessage)
      assert.equal(counter, 4)
    })

    it('sends a CatchAllMessage if no listener matches', async () => {
      const testMessage = new TextMessage(user, 'message123')
      robot.listeners = []
      robot.catchAll(async (message) => {
        assert.ok(message instanceof CatchAllMessage)
        assert.deepEqual(message.message, testMessage)
      })
      await robot.receive(testMessage)
    })

    it('does not trigger a CatchAllMessage if a listener matches', async () => {
      const testMessage = new TextMessage(user, 'message123')

      const matchingListener = async response => {
        assert.deepEqual(response.message, testMessage)
      }

      robot.listen(() => true, null, matchingListener)
      robot.catchAll(null, () => {
        throw new Error('Should not have triggered catchAll')
      })
      await robot.receive(testMessage)
    })

    it('stops processing if a listener marks the message as done', async () => {
      const testMessage = new TextMessage(user, 'message123')

      const matchingListener = async response => {
        response.message.done = true
        assert.deepEqual(response.message, testMessage)
      }
      const listenerSpy = async message => {
        assert.fail('Should not have triggered listener')
      }
      robot.listen(() => true, null, matchingListener)
      robot.listen(() => true, null, listenerSpy)
      await robot.receive(testMessage)
    })

    it('gracefully handles listener uncaughtExceptions (move on to next listener)', async () => {
      const testMessage = {}
      const theError = new Error('Expected error')

      const badListener = async () => {
        throw theError
      }

      let goodListenerCalled = false
      const goodListener = async message => {
        goodListenerCalled = true
      }

      robot.listen(() => true, null, badListener)
      robot.listen(() => true, null, goodListener)
      robot.on('error', (err, response) => {
        assert.deepEqual(err, theError)
        assert.deepEqual(response.message, testMessage)
      })
      await robot.receive(testMessage)
      assert.ok(goodListenerCalled)
    })
  })
  describe('#loadFile', () => {
    let robot = null
    beforeEach(() => {
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
    })
    afterEach(() => {
      robot.shutdown()
      process.removeAllListeners()
    })
    it('should require the specified file', async () => {
      await robot.loadFile(path.resolve('./test/fixtures'), 'TestScript.js')
      assert.deepEqual(robot.hasLoadedTestJsScript, true)
    })

    it('should load an .mjs file', async () => {
      await robot.loadFile(path.resolve('./test/fixtures'), 'TestScript.mjs')
      assert.deepEqual(robot.hasLoadedTestMjsScript, true)
    })

    describe('proper script', () => {
      it('should parse the script documentation', async () => {
        await robot.loadFile(path.resolve('./test/fixtures'), 'TestScript.js')
        assert.deepEqual(robot.helpCommands(), ['hubot test - Responds with a test response'])
      })
    })

    describe('non-Function script', () => {
      it('logs a warning for a .js file that does not export the correct API', async () => {
        let wasCalled = false
        robot.logger.warning = (...args) => {
          wasCalled = true
          assert.ok(args)
        }
        await robot.loadFile(path.resolve('./test/fixtures'), 'TestScriptIncorrectApi.js')
        assert.deepEqual(wasCalled, true)
      })

      it('logs a warning for a .mjs file that does not export the correct API', async () => {
        let wasCalled = false
        robot.logger.warning = (...args) => {
          wasCalled = true
          assert.ok(args)
        }
        await robot.loadFile(path.resolve('./test/fixtures'), 'TestScriptIncorrectApi.mjs')
        assert.deepEqual(wasCalled, true)
      })
    })

    describe('unsupported file extension', () => {
      it('should not be loaded by the Robot', async () => {
        let wasCalled = false
        robot.logger.debug = (...args) => {
          wasCalled = true
          assert.match(args[0], /unsupported file type/)
        }
        await robot.loadFile(path.resolve('./test/fixtures'), 'unsupported.yml')
        assert.deepEqual(wasCalled, true)
      })
    })
  })

  describe('Sending API', () => {
    let robot = null
    beforeEach(async () => {
      hook('hubot-mock-adapter', mockAdapter)
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
      await robot.loadAdapter()
      robot.run()
    })
    afterEach(() => {
      robot.shutdown()
      reset()
    })

    it('#send: delegates to adapter "send" with proper context', async () => {
      let wasCalled = false
      robot.adapter.send = async (envelop, ...strings) => {
        wasCalled = true
        assert.deepEqual(strings, ['test message'], 'The strings should be passed through.')
      }
      await robot.send({}, 'test message')
      assert.deepEqual(wasCalled, true)
    })

    it('#reply: delegates to adapter "reply" with proper context', async () => {
      let wasCalled = false
      robot.adapter.reply = async (envelop, ...strings) => {
        assert.deepEqual(strings, ['test message'], 'The strings should be passed through.')
        wasCalled = true
      }
      await robot.reply({}, 'test message')
      assert.deepEqual(wasCalled, true)
    })

    it('#messageRoom: delegates to adapter "send" with proper context', async () => {
      let wasCalled = false
      robot.adapter.send = async (envelop, ...strings) => {
        assert.equal(envelop.room, 'testRoom', 'The room should be passed through.')
        assert.deepEqual(strings, ['messageRoom test'], 'The strings should be passed through.')
        wasCalled = true
      }
      await robot.messageRoom('testRoom', 'messageRoom test')
      assert.deepEqual(wasCalled, true)
    })
  })
  describe('Listener Registration', () => {
    let robot = null
    let user = null
    beforeEach(() => {
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
      user = new User('1', { name: 'node', room: '#test' })
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('#listen: forwards the matcher, options, and callback to Listener', () => {
      const callback = async () => {}
      const matcher = () => {}
      const options = {}

      robot.listen(matcher, options, callback)
      const testListener = robot.listeners[0]

      assert.deepEqual(testListener.matcher, matcher)
      assert.deepEqual(testListener.callback, callback)
      assert.deepEqual(testListener.options, options)
    })

    it('#hear: matches TextMessages', () => {
      const callback = async () => {}
      const testMessage = new TextMessage(user, 'message123')
      const testRegex = /^message123$/

      robot.hear(testRegex, callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.ok(result)
    })

    it('does not match EnterMessages', () => {
      const callback = async () => {}
      const testMessage = new EnterMessage(user)
      const testRegex = /.*/

      robot.hear(testRegex, callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.deepEqual(result, undefined)
    })

    it('#respond: matches TextMessages addressed to the robot', () => {
      const callback = async () => {}
      const testMessage = new TextMessage(user, 'TestHubot message123')
      const testRegex = /message123$/

      robot.respond(testRegex, callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.ok(result)
    })

    it('does not match EnterMessages', () => {
      const callback = async () => {}
      const testMessage = new EnterMessage(user)
      const testRegex = /.*/

      robot.respond(testRegex, callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.deepEqual(result, undefined)
    })
    it('#enter: matches EnterMessages', () => {
      const callback = async () => {}
      const testMessage = new EnterMessage(user)

      robot.enter(callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.ok(result)
    })

    it('does not match TextMessages', () => {
      const callback = async () => {}
      const testMessage = new TextMessage(user, 'message123')

      robot.enter(callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.deepEqual(result, false)
    })

    it('#leave: matches LeaveMessages', () => {
      const callback = async () => {}
      const testMessage = new LeaveMessage(user)

      robot.leave(callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.ok(result)
    })

    it('does not match TextMessages', () => {
      const callback = async () => {}
      const testMessage = new TextMessage(user, 'message123')

      robot.leave(callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.deepEqual(result, false)
    })
    it('#topic: matches TopicMessages', () => {
      const callback = async () => {}
      const testMessage = new TopicMessage(user)

      robot.topic(callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.deepEqual(result, true)
    })

    it('does not match TextMessages', () => {
      const callback = async () => {}
      const testMessage = new TextMessage(user, 'message123')

      robot.topic(callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.deepEqual(result, false)
    })

    it('#catchAll: matches CatchAllMessages', () => {
      const callback = async () => {}
      const testMessage = new CatchAllMessage(new TextMessage(user, 'message123'))

      robot.catchAll(callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.deepEqual(result, true)
    })

    it('does not match TextMessages', () => {
      const callback = async () => {}
      const testMessage = new TextMessage(user, 'message123')

      robot.catchAll(callback)
      const testListener = robot.listeners[0]
      const result = testListener.matcher(testMessage)

      assert.deepEqual(result, false)
    })
  })
  describe('Message Processing', () => {
    let robot = null
    let user = null
    beforeEach(() => {
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
      user = new User('1', { name: 'node', room: '#test' })
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('calls a matching listener', async () => {
      const testMessage = new TextMessage(user, 'message123')
      robot.hear(/^message123$/, async response => {
        assert.deepEqual(response.message, testMessage)
      })
      await robot.receive(testMessage)
    })

    it('calls multiple matching listeners', async () => {
      const testMessage = new TextMessage(user, 'message123')

      let listenersCalled = 0
      const listenerCallback = async response => {
        assert.deepEqual(response.message, testMessage)
        listenersCalled++
      }

      robot.hear(/^message123$/, listenerCallback)
      robot.hear(/^message123$/, listenerCallback)

      await robot.receive(testMessage)
      assert.equal(listenersCalled, 2)
    })

    it('calls the catch-all listener if no listeners match', async () => {
      const testMessage = new TextMessage(user, 'message123')

      const listenerCallback = async () => {
        assert.fail('Should not have called listener')
      }
      robot.hear(/^no-matches$/, listenerCallback)

      robot.catchAll(async response => {
        assert.deepEqual(response.message, testMessage)
      })

      await robot.receive(testMessage)
    })

    it('does not call the catch-all listener if any listener matched', async () => {
      const testMessage = new TextMessage(user, 'message123')
      let counter = 0
      const listenerCallback = async () => {
        counter++
      }
      robot.hear(/^message123$/, listenerCallback)

      const catchAllCallback = async () => {
        assert.fail('Should not have been called')
      }
      robot.catchAll(catchAllCallback)

      await robot.receive(testMessage)
      assert.equal(counter, 1)
    })

    it('stops processing if message.finish() is called synchronously', async () => {
      const testMessage = new TextMessage(user, 'message123')

      robot.hear(/^message123$/, async response => response.message.finish())
      let wasCalled = false
      const listenerCallback = async () => {
        wasCalled = true
        assert.fail('Should not have been called')
      }
      robot.hear(/^message123$/, listenerCallback)

      await robot.receive(testMessage)
      assert.equal(wasCalled, false)
    })

    it('calls non-TextListener objects', async () => {
      const testMessage = new EnterMessage(user)

      robot.enter(async response => {
        assert.deepEqual(response.message, testMessage)
      })

      await robot.receive(testMessage)
    })

    it('gracefully handles hearer uncaughtExceptions (move on to next hearer)', async () => {
      const testMessage = new TextMessage(user, 'message123')
      const theError = new Error('Expected error to be thrown')

      robot.hear(/^message123$/, async () => {
        throw theError
      })

      let goodListenerCalled = false
      robot.hear(/^message123$/, async response => {
        goodListenerCalled = true
      })
      robot.on('error', (err, response) => {
        assert.deepEqual(err, theError)
        assert.deepEqual(response.message, testMessage)
      })

      await robot.receive(testMessage)
      assert.deepEqual(goodListenerCalled, true)
    })
  })
  describe('Listener Middleware', () => {
    let robot = null
    let user = null
    beforeEach(() => {
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
      user = new User('1', { name: 'node', room: '#test' })
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('allows listener callback execution', async () => {
      let wasCalled = false
      const listenerCallback = async () => {
        wasCalled = true
      }
      robot.hear(/^message123$/, listenerCallback)
      robot.listenerMiddleware(async context => true)

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      assert.deepEqual(wasCalled, true)
    })

    it('can block listener callback execution', async () => {
      let wasCalled = false
      const listenerCallback = async () => {
        wasCalled = true
        assert.fail('Should not have been called')
      }
      robot.hear(/^message123$/, listenerCallback)
      robot.listenerMiddleware(async context => false)

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      assert.deepEqual(wasCalled, false)
    })

    it('receives the correct arguments', async () => {
      robot.hear(/^message123$/, async () => {})
      const testListener = robot.listeners[0]
      const testMessage = new TextMessage(user, 'message123')

      robot.listenerMiddleware(async context => {
        // Escape middleware error handling for clearer test failures
        assert.deepEqual(context.listener, testListener)
        assert.deepEqual(context.response.message, testMessage)
        return true
      })

      await robot.receive(testMessage)
    })

    it('executes middleware in order of definition', async () => {
      const execution = []

      const testMiddlewareA = async context => {
        execution.push('middlewareA')
      }

      const testMiddlewareB = async context => {
        execution.push('middlewareB')
      }

      robot.listenerMiddleware(testMiddlewareA)
      robot.listenerMiddleware(testMiddlewareB)

      robot.hear(/^message123$/, () => execution.push('listener'))

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      execution.push('done')
      assert.deepEqual(execution, [
        'middlewareA',
        'middlewareB',
        'listener',
        'done'
      ])
    })
  })
  describe('Receive Middleware', () => {
    let robot = null
    let user = null
    beforeEach(() => {
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
      user = new User('1', { name: 'node', room: '#test' })
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('fires for all messages, including non-matching ones', async () => {
      let middlewareWasCalled = false
      const middlewareSpy = async () => {
        middlewareWasCalled = true
      }
      let wasCalled = false
      const listenerCallback = async () => {
        wasCalled = true
        assert.fail('Should not have been called')
      }
      robot.hear(/^message123$/, listenerCallback)
      robot.receiveMiddleware(async context => {
        middlewareSpy()
      })

      const testMessage = new TextMessage(user, 'not message 123')

      await robot.receive(testMessage)
      assert.deepEqual(wasCalled, false)
      assert.deepEqual(middlewareWasCalled, true)
    })

    it('can block listener execution', async () => {
      let middlewareWasCalled = false
      const middlewareSpy = async () => {
        middlewareWasCalled = true
      }
      let wasCalled = false
      const listenerCallback = async () => {
        wasCalled = true
        assert.fail('Should not have been called')
      }
      robot.hear(/^message123$/, listenerCallback)
      robot.receiveMiddleware(async context => {
        middlewareSpy()
        return false
      })

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      assert.deepEqual(wasCalled, false)
      assert.deepEqual(middlewareWasCalled, true)
    })

    it('receives the correct arguments', async () => {
      robot.hear(/^message123$/, () => {})
      const testMessage = new TextMessage(user, 'message123')

      robot.receiveMiddleware(async context => {
        assert.deepEqual(context.response.message, testMessage)
      })

      await robot.receive(testMessage)
    })

    it('executes receive middleware in order of definition', async () => {
      const execution = []

      const testMiddlewareA = async context => {
        execution.push('middlewareA')
      }

      const testMiddlewareB = async context => {
        execution.push('middlewareB')
      }

      robot.receiveMiddleware(testMiddlewareA)
      robot.receiveMiddleware(testMiddlewareB)
      robot.hear(/^message123$/, () => execution.push('listener'))

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      execution.push('done')
      assert.deepEqual(execution, [
        'middlewareA',
        'middlewareB',
        'listener',
        'done'
      ])
    })

    it('allows editing the message portion of the given response', async () => {
      const testMiddlewareA = async context => {
        context.response.message.text = 'foobar'
      }

      const testMiddlewareB = async context => {
        assert.equal(context.response.message.text, 'foobar')
      }

      robot.receiveMiddleware(testMiddlewareA)
      robot.receiveMiddleware(testMiddlewareB)
      let wasCalled = false
      const testCallback = () => {
        wasCalled = true
      }
      // We'll never get to this if testMiddlewareA has not modified the message.
      robot.hear(/^foobar$/, testCallback)

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      assert.deepEqual(wasCalled, true)
    })
  })
  describe('Response Middleware', () => {
    let robot = null
    let user = null
    beforeEach(async () => {
      hook('hubot-mock-adapter', mockAdapter)
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
      user = new User('1', { name: 'node', room: '#test' })
      robot.alias = 'Hubot'
      await robot.loadAdapter()
      robot.run()
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('executes response middleware in order', async () => {
      let wasCalled = false
      robot.adapter.send = async (envelope, ...strings) => {
        assert.deepEqual(strings, ['replaced bar-foo, sir, replaced bar-foo.'])
        wasCalled = true
      }
      robot.hear(/^message123$/, async response => await response.send('foobar, sir, foobar.'))

      robot.responseMiddleware(async context => {
        context.strings[0] = context.strings[0].replace(/foobar/g, 'barfoo')
      })

      robot.responseMiddleware(async context => {
        context.strings[0] = context.strings[0].replace(/barfoo/g, 'replaced bar-foo')
      })

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      assert.deepEqual(wasCalled, true)
    })

    it('allows replacing outgoing strings', async () => {
      let wasCalled = false
      robot.adapter.send = async (envelope, ...strings) => {
        wasCalled = true
        assert.deepEqual(strings, ['whatever I want.'])
      }
      robot.hear(/^message123$/, async response => response.send('foobar, sir, foobar.'))

      robot.responseMiddleware(async context => {
        context.strings = ['whatever I want.']
      })

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      assert.deepEqual(wasCalled, true)
    })

    it('marks plaintext as plaintext', async () => {
      robot.adapter.send = async (envelope, ...strings) => {
        assert.deepEqual(strings, ['foobar, sir, foobar.'])
      }
      robot.adapter.play = async (envelope, ...strings) => {
        assert.deepEqual(strings, ['good luck with that'])
      }

      robot.hear(/^message123$/, async response => await response.send('foobar, sir, foobar.'))
      robot.hear(/^message456$/, async response => await response.play('good luck with that'))

      let method
      let plaintext
      robot.responseMiddleware(async context => {
        method = context.method
        plaintext = context.plaintext
      })

      const testMessage = new TextMessage(user, 'message123')

      await robot.receive(testMessage)
      assert.deepEqual(plaintext, true)
      assert.equal(method, 'send')
      const testMessage2 = new TextMessage(user, 'message456')
      await robot.receive(testMessage2)
      assert.deepEqual(plaintext, undefined)
      assert.equal(method, 'play')
    })

    it('does not send trailing functions to middleware', async () => {
      let wasCalled = false
      robot.adapter.send = async (envelope, ...strings) => {
        wasCalled = true
        assert.deepEqual(strings, ['foobar, sir, foobar.'])
      }

      let asserted = false
      robot.hear(/^message123$/, async response => await response.send('foobar, sir, foobar.'))

      robot.responseMiddleware(async context => {
        // We don't send the callback function to middleware, so it's not here.
        assert.deepEqual(context.strings, ['foobar, sir, foobar.'])
        assert.equal(context.method, 'send')
        asserted = true
      })

      const testMessage = new TextMessage(user, 'message123')
      await robot.receive(testMessage)
      assert.deepEqual(asserted, true)
      assert.deepEqual(wasCalled, true)
    })
  })
  describe('Robot ES6', () => {
    let robot = null
    beforeEach(async () => {
      robot = new Robot('MockAdapter', false, 'TestHubot')
      robot.alias = 'Hubot'
      await robot.loadAdapter('./test/fixtures/MockAdapter.mjs')
      await robot.loadFile(path.resolve('./test/fixtures/'), 'TestScript.js')
      robot.run()
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('should load an ES6 module adapter from a file', async () => {
      const { MockAdapter } = await import('./fixtures/MockAdapter.mjs')
      assert.ok(robot.adapter instanceof MockAdapter)
      assert.equal(robot.adapter.name, 'MockAdapter')
    })
    it('should respond to a message', async () => {
      const sent = async (envelop, strings) => {
        assert.deepEqual(strings, ['test response'])
      }
      robot.adapter.on('send', sent)
      await robot.receive(new TextMessage('tester', 'hubot test'))
    })
  })
  describe('Robot Coffeescript', () => {
    let robot = null
    beforeEach(async () => {
      robot = new Robot('MockAdapter', false, 'TestHubot')
      robot.alias = 'Hubot'
      await robot.loadAdapter('./test/fixtures/MockAdapter.coffee')
      await robot.loadFile(path.resolve('./test/fixtures/'), 'TestScript.coffee')
      robot.run()
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('should load a CoffeeScript adapter from a file', async () => {
      assert.equal(robot.adapter.name, 'MockAdapter')
    })
    it('should load a coffeescript file and respond to a message', async () => {
      const sent = async (envelop, strings) => {
        assert.deepEqual(strings, ['test response from coffeescript'])
      }
      robot.adapter.on('send', sent)
      await robot.receive(new TextMessage('tester', 'hubot test'))
    })
  })
  describe('Robot Defaults', () => {
    let robot = null
    beforeEach(async () => {
      robot = new Robot(null, false, 'TestHubot')
      robot.alias = 'Hubot'
      await robot.loadAdapter()
      robot.run()
    })
    afterEach(() => {
      robot.shutdown()
      process.removeAllListeners()
    })
    it('should load the builtin shell adapter by default', async () => {
      assert.equal(robot.adapter.name, 'Shell')
    })
  })
  describe('Robot HTTP Service', () => {
    it('should start a web service', async () => {
      process.env.PORT = 3000
      hook('hubot-mock-adapter', mockAdapter)
      const robot = new Robot('hubot-mock-adapter', true, 'TestHubot')
      await robot.loadAdapter()
      robot.run()
      const res = await fetch(`http://localhost:${process.env.PORT}/hubot/version`)
      assert.equal(res.status, 404)
      assert.match(await res.text(), /Cannot GET \/hubot\/version/ig)
      robot.shutdown()
      reset()
    })
  })
})
