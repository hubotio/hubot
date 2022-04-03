'use strict'

/* global describe, beforeEach, it, afterEach */
/* eslint-disable no-unused-expressions */

// Assertions and Stubbing
const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))

const expect = chai.expect
const domain = '127.0.0.1'

// Hubot classes
const Robot = require('../src/robot')
const CatchAllMessage = require('../src/message').CatchAllMessage
const EnterMessage = require('../src/message').EnterMessage
const LeaveMessage = require('../src/message').LeaveMessage
const TextMessage = require('../src/message').TextMessage
const TopicMessage = require('../src/message').TopicMessage

// mock `hubot-mock-adapter` module from fixture
const mockery = require('mockery')

process.env.PORT = process.env.PORT || 8080

describe('Robot', function () {
  beforeEach(async function() {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false
    })
    mockery.registerMock('hubot-mock-adapter', require('./fixtures/mock-adapter'))
    this.robot = new Robot(null, 'mock-adapter', true, 'TestHubot')
    const a = await this.robot.loadAdapter('mock-adapter')
    this.robot.alias = 'Hubot'
    this.robot.run()
    // Re-throw AssertionErrors for clearer test failures
    this.robot.on('error', function (name, err, response) {
      if (err && err.constructor.name === 'AssertionError') {
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
    mockery.disable()
    this.robot.shutdown()
  })

  describe('Unit Tests', function () {
    describe('#http', function () {
      beforeEach(function () {
        const url = `http://${domain}`
        this.httpClient = this.robot.http(url)
      })

      it('creates a new ScopedHttpClient', function () {
        // 'instanceOf' check doesn't work here due to the design of
        // ScopedHttpClient
        expect(this.httpClient).to.have.property('get')
        expect(this.httpClient).to.have.property('post')
      })

      it('persists the url passed in', function () {
        const url = `http://${domain}`
        const httpClient = this.robot.http(url)
        expect(httpClient.url).to.equal(url)
      })

      it('actually responds to an http get request', function (done) {
        const url = `http://${domain}:${process.env.PORT}`
        const httpClient = this.robot.http(url)
        this.robot.router.get('/', (req, res) => {
          res.end()
        })
        httpClient.get()((err, res, body) => {
          expect(err).to.be.null
          expect(body).to.not.be.null
          expect(res.headers['x-powered-by']).to.be.equal(`hubot/${this.robot.name}`)
          done()
        })
      })

      it('actually does a post', function (done) {
        const url = `http://${domain}:${process.env.PORT}/1`
        const httpClient = this.robot.http(url, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        this.robot.router.post('/:id', (req, res) => {
          expect(req.params.id).to.be.equal('1')
          expect(req.body.name).to.be.equal('jg')
          res.json(req.body)
        })
        httpClient.post('name=jg')((err, res, body) => {
          expect(err).to.be.null
          expect(res.statusCode).to.be.equal(200)
          expect(JSON.parse(body).name).to.be.equal('jg')
          done()
        })
      })

      it('passes options through to the ScopedHttpClient', function () {
        const agent = {}
        const httpClient = this.robot.http(`http://${domain}`, { agent })
        expect(httpClient.options.agent).to.equal(agent)
      })

      it('sets a sane user agent', function () {
        expect(this.httpClient.options.headers['User-Agent']).to.contain('Hubot')
      })

      it('merges in any global http options', function () {
        const agent = {}
        this.robot.globalHttpOptions = { agent }
        const httpClient = this.robot.http(`http://${domain}`)
        expect(httpClient.options.agent).to.equal(agent)
      })

      it('local options override global http options', function () {
        const agentA = {}
        const agentB = {}
        this.robot.globalHttpOptions = { agent: agentA }
        const httpClient = this.robot.http(`http://${domain}`, { agent: agentB })
        expect(httpClient.options.agent).to.equal(agentB)
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

        const listener = {
          async call (response, cb) {
            cb()
          }
        }
        sinon.spy(listener, 'call')

        this.robot.listeners = [
          listener,
          listener,
          listener,
          listener
        ]

        await this.robot.receive(testMessage)
        // When no listeners match, each listener is called twice: once with
        // the original message and once with a CatchAll message
        expect(listener.call).to.have.callCount(8)
      })

      it('sends a CatchAllMessage if no listener matches', async function () {
        // Testing for recursion with a new CatchAllMessage that wraps the
        // original message

        const testMessage = new TextMessage(this.user, 'message123')
        this.robot.listeners = []

        // Replace @robot.receive so we can catch when the functions recurses
        const oldReceive = this.robot.receive
        this.robot.receive = async function (message) {
          expect(message).to.be.instanceof(CatchAllMessage)
          expect(message.message).to.be.equal(testMessage)
        }
        sinon.spy(this.robot, 'receive')

        // Call the original receive method that we want to test
        await oldReceive.call(this.robot, testMessage)
        expect(this.robot.receive).to.have.been.called
      })

      it('does not trigger a CatchAllMessage if a listener matches', async function () {
        const testMessage = new TextMessage(this.user, 'message123')

        const matchingListener = {
          call (message, middleware, doesMatch) {
            // indicate that the message matched the listener
            doesMatch(true)
          }
        }

        // Replace @robot.receive so we can catch if the functions recurses
        const oldReceive = this.robot.receive
        this.robot.receive = sinon.spy()

        this.robot.listeners = [
          matchingListener
        ]

        // Call the original receive method that we want to test
        await oldReceive.call(this.robot, testMessage)

        // Ensure the function did not recurse
        expect(this.robot.receive).to.not.have.been.called
      })

      it('stops processing if a listener marks the message as done', async function () {
        const testMessage = new TextMessage(this.user, 'message123')

        const matchingListener = {
          call (message, middlewareListener, doesMatch) {
            message.done = true
            // Listener must have matched
            doesMatch(true)
          }
        }

        const listenerSpy =
          { call: sinon.spy() }

        this.robot.listeners = [
          matchingListener,
          listenerSpy
        ]

        await this.robot.receive(testMessage)
        expect(listenerSpy.call).to.not.have.been.called
      })

      it('gracefully handles listener uncaughtExceptions (move on to next listener)', async function () {
        const testMessage = {}
        const theError = new Error()

        const badListener = {
          async call () {
            throw theError
          }
        }

        let goodListenerCalled = false
        const goodListener = {
          async call (_, middelwareListener, doesMatch) {
            goodListenerCalled = true
            doesMatch(true)
          }
        }

        this.robot.listeners = [
          badListener,
          goodListener
        ]

        this.robot.emit = function (name, err, message) {
          expect(name).to.equal('error')
          expect(err).to.equal(theError)
          expect(message).to.equal(testMessage)
        }
        sinon.spy(this.robot, 'emit')

        await this.robot.receive(testMessage)
        expect(this.robot.emit).to.have.been.called
        expect(goodListenerCalled).to.be.ok
      })
    })

    describe('#loadFile', function () {
      beforeEach(function () {
        this.sandbox = sinon.sandbox.create()
      })

      afterEach(function () {
        this.sandbox.restore()
      })

      it('should require the specified file', function () {
        const module = require('module')

        const script = sinon.spy(function (robot) {})
        this.sandbox.stub(module, '_load').returns(script)
        this.sandbox.stub(this.robot, 'parseHelp')

        this.robot.loadFile('./scripts', 'test-script.js')
        expect(module._load).to.have.been.calledWith('scripts/test-script.js')
      })

      it('should load .mjs files in the scripts folder', async function () {
        const module = await this.robot.loadMjsFile('../test/test-script.mjs')
        expect(module.default).to.be.a('function')
      })

      describe('proper script', function () {
        beforeEach(function () {
          const module = require('module')

          this.script = sinon.spy(function (robot) {})
          this.sandbox.stub(module, '_load').returns(this.script)
          this.sandbox.stub(this.robot, 'parseHelp')
        })

        it('should call the script with the Robot', function () {
          this.robot.loadFile('./scripts', 'test-script.js')
          expect(this.script).to.have.been.calledWith(this.robot)
        })

        it('should parse the script documentation', function () {
          this.robot.loadFile('./scripts', 'test-script.js')
          expect(this.robot.parseHelp).to.have.been.calledWith('scripts/test-script.js')
        })
      })

      describe('non-Function script', function () {
        beforeEach(function () {
          const module = require('module')

          this.script = {}
          this.sandbox.stub(module, '_load').returns(this.script)
          this.sandbox.stub(this.robot, 'parseHelp')
        })

        it('logs a warning', function () {
          sinon.stub(this.robot.logger, 'warning')
          this.robot.loadFile('./scripts', 'test-script.js')
          expect(this.robot.logger.warning).to.have.been.called
        })
      })

      describe('unsupported file extension', function () {
        beforeEach(function () {
          const module = require('module')

          this.script = sinon.spy(function (robot) {})
          this.sandbox.stub(module, '_load').returns(this.script)
          this.sandbox.stub(this.robot, 'parseHelp')
        })

        it('should not be loaded by the Robot', function () {
          this.robot.loadFile('./scripts', 'unsupported.yml')
          expect(this.script).to.not.have.been.calledWith(this.robot)
        })
      })
    })

    describe('#send', function () {
      beforeEach(function () {
        sinon.spy(this.robot.adapter, 'send')
      })

      it('delegates to adapter "send" with proper context', function () {
        this.robot.send({}, 'test message')
        expect(this.robot.adapter.send).to.have.been.calledOn(this.robot.adapter)
      })
    })

    describe('#reply', function () {
      beforeEach(function () {
        sinon.spy(this.robot.adapter, 'reply')
      })

      it('delegates to adapter "reply" with proper context', function () {
        this.robot.reply({}, 'test message')
        expect(this.robot.adapter.reply).to.have.been.calledOn(this.robot.adapter)
      })
    })

    describe('#messageRoom', function () {
      beforeEach(function () {
        sinon.spy(this.robot.adapter, 'send')
      })

      it('delegates to adapter "send" with proper context', function () {
        this.robot.messageRoom('testRoom', 'messageRoom test')
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
      this.robot.hear(/^message123$/, function (response) {
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

      this.robot.catchAll(function (response) {
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
      expect(listenerCallback).to.have.been.called.once
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

    it('gracefully handles listener uncaughtExceptions (move on to next listener)', async function () {
      const testMessage = new TextMessage(this.user, 'message123')
      const theError = new Error()

      this.robot.hear(/^message123$/, function () {
        throw theError
      })

      let goodListenerCalled = false
      this.robot.hear(/^message123$/, () => {
        goodListenerCalled = true
      })

      this.robot.emit = function (name, err, response) {
        expect(name).to.equal('error')
        expect(err).to.equal(theError)
        expect(response.message).to.equal(testMessage)
      }
      sinon.spy(this.robot, 'emit')

      await this.robot.receive(testMessage)
      expect(this.robot.emit).to.have.been.called
      expect(goodListenerCalled).to.be.ok
    })

    describe('Listener Middleware', function () {
      it('allows listener callback execution', async function () {
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.listenerMiddleware((context) =>{
          expect(context).to.be.ok
        })

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(listenerCallback).to.have.been.called
      })

      it('can block listener callback execution', async function () {
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.listenerMiddleware((context) => {
          // Block Listener callback execution
          context.response.message.done = true
          expect(context.response).to.be.ok
        })

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(listenerCallback).to.not.have.been.called
      })

      it('receives the correct arguments', async function () {
        this.robot.hear(/^message123$/, function () {})
        const testListener = this.robot.listeners[0]
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.listenerMiddleware((context) => {
          expect(context.listener).to.equal(testListener)
          expect(context.response.message).to.equal(testMessage)
        })

        await this.robot.receive(testMessage)
      })
    })

    describe('Receive Middleware', function () {
      it('fires for all messages, including non-matching ones', async function () {
        const middlewareSpy = sinon.spy()
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.receiveMiddleware(function (context) {
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
        this.robot.receiveMiddleware(function (r, context) {
          // Block Listener callback execution
          middlewareSpy()
          context.response.message.done = true
        })

        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
        expect(listenerCallback).to.not.have.been.called
        expect(middlewareSpy).to.have.been.called
      })

      it('receives the correct arguments', async function () {
        this.robot.hear(/^message123$/, function () {})
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.receiveMiddleware(function (_, context) {
          expect(context.response.message).to.equal(testMessage)
        })

        await this.robot.receive(testMessage)
      })

      it('allows editing the message portion of the given response', async function () {
        const testMiddlewareA = function (_, context) {
          context.response.message.text = 'foobar'
        }

        const testMiddlewareB = function (_, context) {
          // Subsequent middleware should see the modified message
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
        this.robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))
        this.robot.responseMiddleware(function (r, context) {
          context.strings[0] = context.strings[0].replace(/foobar/g, 'barfoo')
        })

        this.robot.responseMiddleware(function (r, context) {
          context.strings[0] = context.strings[0].replace(/barfoo/g, 'replaced bar-foo')
        })

        this.robot.adapter.send = async function(envelope, ...strings){
          expect(strings[0]).to.equal('replaced bar-foo, sir, replaced bar-foo.')
        }
        const testMessage = new TextMessage(this.user, 'message123')
        await this.robot.receive(testMessage)
      })

      it('allows replacing outgoing strings', async function () {
        this.robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))

        this.robot.responseMiddleware(function (context) {
          context.strings = ['whatever I want.']
        })

        const testMessage = new TextMessage(this.user, 'message123')
        this.robot.adapter.send = async function(envelope, ...strings){
          expect(strings[0]).to.equal('whatever I want.')
        }
        await this.robot.receive(testMessage)
      })

      it('marks plaintext as plaintext', async function () {
        const sendSpy = sinon.spy()
        this.robot.adapter.send = sendSpy
        this.robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))
        this.robot.hear(/^message456$/, response => response.play('good luck with that'))

        let method
        let plaintext
        this.robot.responseMiddleware(function (r, context) {
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
    })
  })
})
