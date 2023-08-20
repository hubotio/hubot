'use strict'

/* global describe, beforeEach, it, afterEach */
/* eslint-disable no-unused-expressions */

// Assertions and Stubbing
const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))

const expect = chai.expect

// Hubot classes
const Robot = require('../src/robot')
const CatchAllMessage = require('../src/message').CatchAllMessage
const EnterMessage = require('../src/message').EnterMessage
const LeaveMessage = require('../src/message').LeaveMessage
const TextMessage = require('../src/message').TextMessage
const TopicMessage = require('../src/message').TopicMessage

const path = require('path')
const { hook, reset } = require('./fixtures/RequireMocker.js')

describe('Robot', function () {
  beforeEach(async function () {
    hook('hubot-mock-adapter', require('./fixtures/mock-adapter.js'))
    process.env.EXPRESS_PORT = 0
    this.robot = new Robot('hubot-mock-adapter', true, 'TestHubot')
    this.robot.alias = 'Hubot'
    await this.robot.loadAdapter()
    this.robot.run()

    // Re-throw AssertionErrors for clearer test failures
    this.robot.on('error', function (name, err, response) {
      if (err?.constructor.name === 'AssertionError' || name instanceof chai.AssertionError) {
        process.nextTick(function () {
          throw err
        })
      }
    })

    this.user = this.robot.brain.userForId('1', {
      name: 'hubottester',
      room: '#mocha'
    })
  })

  afterEach(function () {
    reset()
    this.robot.shutdown()
  })

  describe('Unit Tests', function () {
    describe('#http', function () {
      beforeEach(function () {
        const url = 'http://localhost'
        this.httpClient = this.robot.http(url)
      })

      it('creates a new ScopedHttpClient', function () {
        // 'instanceOf' check doesn't work here due to the design of
        // ScopedHttpClient
        expect(this.httpClient).to.have.property('get')
        expect(this.httpClient).to.have.property('post')
      })

      it('passes options through to the ScopedHttpClient', function () {
        const agent = {}
        const httpClient = this.robot.http('http://localhost', { agent })
        expect(httpClient.options.agent).to.equal(agent)
      })

      it('sets a sane user agent', function () {
        expect(this.httpClient.options.headers['User-Agent']).to.contain('Hubot')
      })

      it('merges in any global http options', function () {
        const agent = {}
        this.robot.globalHttpOptions = { agent }
        const httpClient = this.robot.http('http://localhost')
        expect(httpClient.options.agent).to.equal(agent)
      })

      it('local options override global http options', function () {
        const agentA = {}
        const agentB = {}
        this.robot.globalHttpOptions = { agent: agentA }
        const httpClient = this.robot.http('http://localhost', { agent: agentB })
        expect(httpClient.options.agent).to.equal(agentB)
      })

      it('builds the url correctly from a string', function () {
        const options = this.httpClient.buildOptions('http://localhost:3001')
        expect(options.host).to.equal('localhost:3001')
        expect(options.pathname).to.equal('/')
        expect(options.protocol).to.equal('http:')
        expect(options.port).to.equal('3001')
      })
    })

    describe('#respondPattern', function () {
      it('matches messages starting with robot\'s name', function () {
        const testMessage = this.robot.name + 'message123'
        const testRegex = /(.*)/

        const pattern = this.robot.respondPattern(testRegex)
        expect(testMessage).to.match(pattern)
        const match = testMessage.match(pattern)[1]
        expect(match).to.equal('message123')
      })

      it('matches messages starting with robot\'s alias', function () {
        const testMessage = this.robot.alias + 'message123'
        const testRegex = /(.*)/

        const pattern = this.robot.respondPattern(testRegex)
        expect(testMessage).to.match(pattern)
        const match = testMessage.match(pattern)[1]
        expect(match).to.equal('message123')
      })

      it('does not match unaddressed messages', function () {
        const testMessage = 'message123'
        const testRegex = /(.*)/

        const pattern = this.robot.respondPattern(testRegex)
        expect(testMessage).to.not.match(pattern)
      })

      it('matches properly when name is substring of alias', function () {
        this.robot.name = 'Meg'
        this.robot.alias = 'Megan'
        const testMessage1 = this.robot.name + ' message123'
        const testMessage2 = this.robot.alias + ' message123'
        const testRegex = /(.*)/

        const pattern = this.robot.respondPattern(testRegex)

        expect(testMessage1).to.match(pattern)
        const match1 = testMessage1.match(pattern)[1]
        expect(match1).to.equal('message123')

        expect(testMessage2).to.match(pattern)
        const match2 = testMessage2.match(pattern)[1]
        expect(match2).to.equal('message123')
      })

      it('matches properly when alias is substring of name', function () {
        this.robot.name = 'Megan'
        this.robot.alias = 'Meg'
        const testMessage1 = this.robot.name + ' message123'
        const testMessage2 = this.robot.alias + ' message123'
        const testRegex = /(.*)/

        const pattern = this.robot.respondPattern(testRegex)

        expect(testMessage1).to.match(pattern)
        const match1 = testMessage1.match(pattern)[1]
        expect(match1).to.equal('message123')

        expect(testMessage2).to.match(pattern)
        const match2 = testMessage2.match(pattern)[1]
        expect(match2).to.equal('message123')
      })
    })

    describe('#listen', () =>
      it('registers a new listener directly', function () {
        expect(this.robot.listeners).to.have.length(0)
        this.robot.listen(function () {}, function () {})
        expect(this.robot.listeners).to.have.length(1)
      })
    )

    describe('#hear', () =>
      it('registers a new listener directly', function () {
        expect(this.robot.listeners).to.have.length(0)
        this.robot.hear(/.*/, function () {})
        expect(this.robot.listeners).to.have.length(1)
      })
    )

    describe('#respond', () =>
      it('registers a new listener using hear', function () {
        sinon.spy(this.robot, 'hear')
        this.robot.respond(/.*/, function () {})
        expect(this.robot.hear).to.have.been.called
      })
    )

    describe('#enter', () =>
      it('registers a new listener using listen', function () {
        sinon.spy(this.robot, 'listen')
        this.robot.enter(function () {})
        expect(this.robot.listen).to.have.been.called
      })
    )

    describe('#leave', () =>
      it('registers a new listener using listen', function () {
        sinon.spy(this.robot, 'listen')
        this.robot.leave(function () {})
        expect(this.robot.listen).to.have.been.called
      })
    )

    describe('#topic', () =>
      it('registers a new listener using listen', function () {
        sinon.spy(this.robot, 'listen')
        this.robot.topic(function () {})
        expect(this.robot.listen).to.have.been.called
      })
    )

    describe('#catchAll', () =>
      it('registers a new listener using listen', function () {
        sinon.spy(this.robot, 'listen')
        this.robot.catchAll(function () {})
        expect(this.robot.listen).to.have.been.called
      })
    )

    describe('#receive', function () {
      it('calls all registered listeners', async function () {
        // Need to use a real Message so that the CatchAllMessage constructor works
        const testMessage = new TextMessage(this.user, 'message123')
        let counter = 0
        const listener = async message => {
          counter++
        }
        this.robot.listen(() => true, null, listener)
        this.robot.listen(() => true, null, listener)
        this.robot.listen(() => true, null, listener)
        this.robot.listen(() => true, null, listener)
        await this.robot.receive(testMessage)
        expect(counter).to.equal(4)
      })

      // TODO: catchAll doesn't take a function for first arg
      it('sends a CatchAllMessage if no listener matches', async function () {
        const testMessage = new TextMessage(this.user, 'message123')
        this.robot.listeners = []
        this.robot.catchAll(null, async (message) => {
          expect(message).to.be.instanceof(CatchAllMessage)
          expect(message.message).to.be.equal(testMessage)
        })
        await this.robot.receive(testMessage)
      })

      it('does not trigger a CatchAllMessage if a listener matches', async function () {
        const testMessage = new TextMessage(this.user, 'message123')

        const matchingListener = async response => {
          expect(response.message).to.be.equal(testMessage)
        }

        this.robot.listen(() => true, null, matchingListener)
        this.robot.catchAll(null, () => {
          throw new Error('Should not have triggered catchAll')
        })
        await this.robot.receive(testMessage)
      })

      it('stops processing if a listener marks the message as done', async function () {
        const testMessage = new TextMessage(this.user, 'message123')

        const matchingListener = async response => {
          response.message.done = true
          expect(response.message).to.be.equal(testMessage)
        }
        const listenerSpy = async message => {
          expect.fail('Should not have triggered listener')
        }
        this.robot.listen(() => true, null, matchingListener)
        this.robot.listen(() => true, null, listenerSpy)
        await this.robot.receive(testMessage)
      })

      it('gracefully handles listener uncaughtExceptions (move on to next listener)', async function () {
        const testMessage = {}
        const theError = new Error()

        const badListener = async () => {
          throw theError
        }

        let goodListenerCalled = false
        const goodListener = async message => {
          goodListenerCalled = true
        }

        this.robot.listen(() => true, null, badListener)
        this.robot.listen(() => true, null, goodListener)
        this.robot.on('error', (name, err, response) => {
          expect(name).to.equal('error')
          expect(err).to.equal(theError)
          expect(response.message).to.equal(testMessage)
        })
        await this.robot.receive(testMessage)
        expect(goodListenerCalled).to.be.ok
      })
    })

    describe('#loadFile', function () {
      beforeEach(function () {
        this.sandbox = sinon.createSandbox()
      })

      afterEach(function () {
        this.sandbox.restore()
      })

      it('should require the specified file', async function () {
        await this.robot.loadFile(path.resolve('./test/fixtures'), 'TestScript.js')
        expect(this.robot.hasLoadedTestJsScript).to.be.true
      })

      it('should load an .mjs file', async function () {
        await this.robot.loadFile(path.resolve('./test/fixtures'), 'TestScript.mjs')
        expect(this.robot.hasLoadedTestMjsScript).to.be.true
      })

      describe('proper script', function () {
        it('should parse the script documentation', async function () {
          await this.robot.loadFile(path.resolve('./test/fixtures'), 'TestScript.js')
          expect(this.robot.helpCommands()).to.eql(['hubot test - Responds with a test response'])
        })
      })

      describe('non-Function script', function () {
        it('logs a warning for a .js file that does not export the correct API', async function () {
          sinon.stub(this.robot.logger, 'warning')
          await this.robot.loadFile(path.resolve('./test/fixtures'), 'TestScriptIncorrectApi.js')
          expect(this.robot.logger.warning).to.have.been.called
        })

        it('logs a warning for a .mjs file that does not export the correct API', async function () {
          sinon.stub(this.robot.logger, 'warning')
          await this.robot.loadFile(path.resolve('./test/fixtures'), 'TestScriptIncorrectApi.mjs')
          expect(this.robot.logger.warning).to.have.been.called
        })
      })

      describe('unsupported file extension', function () {
        it('should not be loaded by the Robot', async function () {
          sinon.spy(this.robot.logger, 'debug')
          await this.robot.loadFile(path.resolve('./test/fixtures'), 'unsupported.yml')
          expect(this.robot.logger.debug).to.have.been.calledWithMatch(/unsupported file type/)
        })
      })
    })

    describe('#send', function () {
      beforeEach(function () {
        sinon.spy(this.robot.adapter, 'send')
      })

      it('delegates to adapter "send" with proper context', async function () {
        await this.robot.send({}, 'test message')
        expect(this.robot.adapter.send).to.have.been.calledOn(this.robot.adapter)
      })
    })

    describe('#reply', function () {
      beforeEach(function () {
        sinon.spy(this.robot.adapter, 'reply')
      })

      it('delegates to adapter "reply" with proper context', async function () {
        await this.robot.reply({}, 'test message')
        expect(this.robot.adapter.reply).to.have.been.calledOn(this.robot.adapter)
      })
    })

    describe('#messageRoom', function () {
      beforeEach(function () {
        sinon.spy(this.robot.adapter, 'send')
      })

      it('delegates to adapter "send" with proper context', async function () {
        await this.robot.messageRoom('testRoom', 'messageRoom test')
        expect(this.robot.adapter.send).to.have.been.calledOn(this.robot.adapter)
      })
    })

    describe('#on', function () {
      beforeEach(function () {
        sinon.spy(this.robot.events, 'on')
      })

      it('delegates to events "on" with proper context', function () {
        this.robot.on('event', function () {})
        expect(this.robot.events.on).to.have.been.calledOn(this.robot.events)
      })
    })

    describe('#emit', function () {
      beforeEach(function () {
        sinon.spy(this.robot.events, 'emit')
      })

      it('delegates to events "emit" with proper context', function () {
        this.robot.emit('event', function () {})
        expect(this.robot.events.emit).to.have.been.calledOn(this.robot.events)
      })
    })
  })

  describe('Listener Registration', function () {
    describe('#listen', () =>
      it('forwards the matcher, options, and callback to Listener', function () {
        const callback = sinon.spy()
        const matcher = sinon.spy()
        const options = {}

        this.robot.listen(matcher, options, callback)
        const testListener = this.robot.listeners[0]

        expect(testListener.matcher).to.equal(matcher)
        expect(testListener.callback).to.equal(callback)
        expect(testListener.options).to.equal(options)
      })
    )

    describe('#hear', function () {
      it('matches TextMessages', function () {
        const callback = sinon.spy()
        const testMessage = new TextMessage(this.user, 'message123')
        const testRegex = /^message123$/

        this.robot.hear(testRegex, callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.be.ok
      })

      it('does not match EnterMessages', function () {
        const callback = sinon.spy()
        const testMessage = new EnterMessage(this.user)
        const testRegex = /.*/

        this.robot.hear(testRegex, callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.not.be.ok
      })
    })

    describe('#respond', function () {
      it('matches TextMessages addressed to the robot', function () {
        const callback = sinon.spy()
        const testMessage = new TextMessage(this.user, 'TestHubot message123')
        const testRegex = /message123$/

        this.robot.respond(testRegex, callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.be.ok
      })

      it('does not match EnterMessages', function () {
        const callback = sinon.spy()
        const testMessage = new EnterMessage(this.user)
        const testRegex = /.*/

        this.robot.respond(testRegex, callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.not.be.ok
      })
    })

    describe('#enter', function () {
      it('matches EnterMessages', function () {
        const callback = sinon.spy()
        const testMessage = new EnterMessage(this.user)

        this.robot.enter(callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.be.ok
      })

      it('does not match TextMessages', function () {
        const callback = sinon.spy()
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.enter(callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.not.be.ok
      })
    })

    describe('#leave', function () {
      it('matches LeaveMessages', function () {
        const callback = sinon.spy()
        const testMessage = new LeaveMessage(this.user)

        this.robot.leave(callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.be.ok
      })

      it('does not match TextMessages', function () {
        const callback = sinon.spy()
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.leave(callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.not.be.ok
      })
    })

    describe('#topic', function () {
      it('matches TopicMessages', function () {
        const callback = sinon.spy()
        const testMessage = new TopicMessage(this.user)

        this.robot.topic(callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.be.ok
      })

      it('does not match TextMessages', function () {
        const callback = sinon.spy()
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.topic(callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.not.be.ok
      })
    })

    describe('#catchAll', function () {
      it('matches CatchAllMessages', function () {
        const callback = sinon.spy()
        const testMessage = new CatchAllMessage(new TextMessage(this.user, 'message123'))

        this.robot.catchAll(callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.be.ok
      })

      it('does not match TextMessages', function () {
        const callback = sinon.spy()
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.catchAll(callback)
        const testListener = this.robot.listeners[0]
        const result = testListener.matcher(testMessage)

        expect(result).to.not.be.ok
      })
    })
  })

  describe('Message Processing', function () {
    it('calls a matching listener', async function () {
      const testMessage = new TextMessage(this.user, 'message123')
      this.robot.hear(/^message123$/, async function (response) {
        expect(response.message).to.equal(testMessage)
      })
      await this.robot.receive(testMessage)
    })

    it('calls multiple matching listeners', async function () {
      const testMessage = new TextMessage(this.user, 'message123')

      let listenersCalled = 0
      const listenerCallback = function (response) {
        expect(response.message).to.equal(testMessage)
        listenersCalled++
      }

      this.robot.hear(/^message123$/, listenerCallback)
      this.robot.hear(/^message123$/, listenerCallback)

      await this.robot.receive(testMessage)
      expect(listenersCalled).to.equal(2)
    })

    it('calls the catch-all listener if no listeners match', async function () {
      const testMessage = new TextMessage(this.user, 'message123')

      const listenerCallback = sinon.spy()
      this.robot.hear(/^no-matches$/, listenerCallback)

      this.robot.catchAll(async function (response) {
        expect(listenerCallback).to.not.have.been.called
        expect(response.message).to.equal(testMessage)
      })

      await this.robot.receive(testMessage)
    })

    it('does not call the catch-all listener if any listener matched', async function () {
      const testMessage = new TextMessage(this.user, 'message123')

      const listenerCallback = sinon.spy()
      this.robot.hear(/^message123$/, listenerCallback)

      const catchAllCallback = sinon.spy()
      this.robot.catchAll(catchAllCallback)

      await this.robot.receive(testMessage)
      expect(listenerCallback).to.have.been.calledOnce
      expect(catchAllCallback).to.not.have.been.called
    })

    it('stops processing if message.finish() is called synchronously', async function () {
      const testMessage = new TextMessage(this.user, 'message123')

      this.robot.hear(/^message123$/, response => response.message.finish())

      const listenerCallback = sinon.spy()
      this.robot.hear(/^message123$/, listenerCallback)

      await this.robot.receive(testMessage)
      expect(listenerCallback).to.not.have.been.called
    })

    it('calls non-TextListener objects', async function () {
      const testMessage = new EnterMessage(this.user)

      this.robot.enter(function (response) {
        expect(response.message).to.equal(testMessage)
      })

      await this.robot.receive(testMessage)
    })

    it('gracefully handles hearer uncaughtExceptions (move on to next hearer)', async function () {
      const testMessage = new TextMessage(this.user, 'message123')
      const theError = new Error()

      this.robot.hear(/^message123$/, async function () {
        throw theError
      })

      let goodListenerCalled = false
      this.robot.hear(/^message123$/, async response => {
        goodListenerCalled = true
      })
      this.robot.on('error', (name, err, response) => {
        expect(name).to.equal('error')
        expect(err).to.equal(theError)
        expect(response.message).to.equal(testMessage)
      })

      await this.robot.receive(testMessage)
      expect(goodListenerCalled).to.be.ok
    })

    describe('Listener Middleware', function () {
      it('allows listener callback execution', async function () {
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.listenerMiddleware(async context => true)

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(listenerCallback).to.have.been.called
      })

      it('can block listener callback execution', async function () {
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.listenerMiddleware(async context => false)

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(listenerCallback).to.not.have.been.called
      })

      it('receives the correct arguments', async function () {
        this.robot.hear(/^message123$/, function () {})
        const testListener = this.robot.listeners[0]
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.listenerMiddleware(async context => {
          // Escape middleware error handling for clearer test failures
          expect(context.listener).to.equal(testListener)
          expect(context.response.message).to.equal(testMessage)
          return true
        })

        await this.robot.receive(testMessage)
      })

      it('executes middleware in order of definition', async function () {
        const execution = []

        const testMiddlewareA = async context => {
          execution.push('middlewareA')
        }

        const testMiddlewareB = async context => {
          execution.push('middlewareB')
        }

        this.robot.listenerMiddleware(testMiddlewareA)
        this.robot.listenerMiddleware(testMiddlewareB)

        this.robot.hear(/^message123$/, () => execution.push('listener'))

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        execution.push('done')
        expect(execution).to.deep.equal([
          'middlewareA',
          'middlewareB',
          'listener',
          'done'
        ])
      })
    })

    describe('Receive Middleware', function () {
      it('fires for all messages, including non-matching ones', async function () {
        const middlewareSpy = sinon.spy()
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.receiveMiddleware(async context => {
          middlewareSpy()
        })

        const testMessage = new TextMessage(this.user, 'not message 123')

        await this.robot.receive(testMessage)
        expect(listenerCallback).to.not.have.been.called
        expect(middlewareSpy).to.have.been.called
      })

      it('can block listener execution', async function () {
        const middlewareSpy = sinon.spy()
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.receiveMiddleware(async context => {
          middlewareSpy()
          return false
        })

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(listenerCallback).to.not.have.been.called
        expect(middlewareSpy).to.have.been.called
      })

      it('receives the correct arguments', async function () {
        this.robot.hear(/^message123$/, function () {})
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.receiveMiddleware(async context => {
          expect(context.response.message).to.equal(testMessage)
        })

        await this.robot.receive(testMessage)
      })

      it('executes receive middleware in order of definition', async function () {
        const execution = []

        const testMiddlewareA = async context => {
          execution.push('middlewareA')
        }

        const testMiddlewareB = async context => {
          execution.push('middlewareB')
        }

        this.robot.receiveMiddleware(testMiddlewareA)
        this.robot.receiveMiddleware(testMiddlewareB)
        this.robot.hear(/^message123$/, () => execution.push('listener'))

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        execution.push('done')
        expect(execution).to.deep.equal([
          'middlewareA',
          'middlewareB',
          'listener',
          'done'
        ])
      })

      it('allows editing the message portion of the given response', async function () {
        const testMiddlewareA = async context => {
          context.response.message.text = 'foobar'
        }

        const testMiddlewareB = async context => {
          expect(context.response.message.text).to.equal('foobar')
        }

        this.robot.receiveMiddleware(testMiddlewareA)
        this.robot.receiveMiddleware(testMiddlewareB)

        const testCallback = sinon.spy()
        // We'll never get to this if testMiddlewareA has not modified the message.
        this.robot.hear(/^foobar$/, testCallback)

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(testCallback).to.have.been.called
      })
    })

    describe('Response Middleware', function () {
      it('executes response middleware in order', async function () {
        let sendSpy
        this.robot.adapter.send = (sendSpy = sinon.spy())
        this.robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))

        this.robot.responseMiddleware(async context => {
          context.strings[0] = context.strings[0].replace(/foobar/g, 'barfoo')
        })

        this.robot.responseMiddleware(async context => {
          context.strings[0] = context.strings[0].replace(/barfoo/g, 'replaced bar-foo')
        })

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(sendSpy.getCall(0).args[1]).to.equal('replaced bar-foo, sir, replaced bar-foo.')
      })

      it('allows replacing outgoing strings', async function () {
        let sendSpy
        this.robot.adapter.send = (sendSpy = sinon.spy())
        this.robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))

        this.robot.responseMiddleware(async context => {
          context.strings = ['whatever I want.']
        })

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(sendSpy.getCall(0).args[1]).to.deep.equal('whatever I want.')
      })

      it('marks plaintext as plaintext', async function () {
        const sendSpy = sinon.spy()
        this.robot.adapter.send = sendSpy
        this.robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))
        this.robot.hear(/^message456$/, response => response.play('good luck with that'))

        let method
        let plaintext
        this.robot.responseMiddleware(async context => {
          method = context.method
          plaintext = context.plaintext
        })

        const testMessage = new TextMessage(this.user, 'message123')

        await this.robot.receive(testMessage)
        expect(plaintext).to.equal(true)
        expect(method).to.equal('send')
        const testMessage2 = new TextMessage(this.user, 'message456')
        await this.robot.receive(testMessage2)
        expect(plaintext).to.equal(undefined)
        expect(method).to.equal('play')
      })

      it('does not send trailing functions to middleware', async function () {
        let sendSpy
        this.robot.adapter.send = (sendSpy = sinon.spy())
        let asserted = false
        const postSendCallback = function () {}
        this.robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.', postSendCallback))

        this.robot.responseMiddleware(async context => {
          // We don't send the callback function to middleware, so it's not here.
          expect(context.strings).to.deep.equal(['foobar, sir, foobar.'])
          expect(context.method).to.equal('send')
          asserted = true
        })

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(asserted).to.equal(true)
        expect(sendSpy.getCall(0).args[1]).to.equal('foobar, sir, foobar.')
        expect(sendSpy.getCall(0).args[2]).to.equal(postSendCallback)
      })
    })
  })
})

describe('Robot Defaults', () => {
  let robot = null
  beforeEach(async () => {
    process.env.EXPRESS_PORT = 0
    robot = new Robot(null, true, 'TestHubot')
    robot.alias = 'Hubot'
    await robot.loadAdapter()
    robot.run()
  })
  afterEach(() => {
    robot.shutdown()
  })
  it('should load the builtin shell adapter by default', async () => {
    expect(robot.adapter.name).to.equal('Shell')
  })
})

describe('Robot ES6', () => {
  let robot = null
  beforeEach(async () => {
    process.env.EXPRESS_PORT = 0
    robot = new Robot('MockAdapter', true, 'TestHubot')
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
    expect(robot.adapter).to.be.an.instanceOf(MockAdapter)
    expect(robot.adapter.name).to.equal('MockAdapter')
  })
  it('should respond to a message', async () => {
    const sent = (envelop, strings) => {
      expect(strings).to.deep.equal(['test response'])
    }
    robot.adapter.on('send', sent)
    await robot.adapter.receive(new TextMessage('tester', 'hubot test'))
  })
})

describe('Robot Coffeescript', () => {
  let robot = null
  beforeEach(async () => {
    process.env.EXPRESS_PORT = 0
    robot = new Robot('MockAdapter', true, 'TestHubot')
    robot.alias = 'Hubot'
    await robot.loadAdapter('./test/fixtures/MockAdapter.coffee')
    await robot.loadFile(path.resolve('./test/fixtures/'), 'TestScript.coffee')
    robot.run()
  })
  afterEach(() => {
    robot.shutdown()
  })
  it('should load a CoffeeScript adapter from a file', async () => {
    expect(robot.adapter.name).to.equal('MockAdapter')
  })
  it('should load a coffeescript file and respond to a message', async () => {
    const sent = (envelop, strings) => {
      expect(strings).to.deep.equal(['test response from coffeescript'])
    }
    robot.adapter.on('send', sent)
    await robot.adapter.receive(new TextMessage('tester', 'hubot test'))
  })
})
