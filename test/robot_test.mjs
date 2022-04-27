'use strict'

/* global describe, beforeEach, it, afterEach */
/* eslint-disable no-unused-expressions */

// Assertions and Stubbing
import chai from 'chai'
import sinon from 'sinon'
import cs from 'sinon-chai'
import Robot from '../src/robot.mjs'
import { CatchAllMessage, EnterMessage, LeaveMessage, TextMessage, TopicMessage } from '../src/message.mjs'
import {URL} from 'url'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = new URL('.', import.meta.url).pathname
chai.use(cs)

const expect = chai.expect
const domain = '127.0.0.1'

describe('Robot', function () {
  beforeEach(async function() {
    let pathToLookForAdapters = fileURLToPath(import.meta.url).replace('/test/robot_test.mjs', '')
    pathToLookForAdapters = path.resolve(pathToLookForAdapters, 'test/fixtures')
    this.robot = new Robot(pathToLookForAdapters, 'shell', 'TestHubot', 'Hubot', 0)
    await this.robot.setupExpress()
    try{
      await this.robot.loadAdapter('shell.mjs')
      this.robot.run()
      // Re-throw AssertionErrors for clearer test failures
      this.robot.on('error', function (name, err, response) {
        if (err && err.constructor.name === 'AssertionError') {
          throw err
        }
      })
      this.user = this.robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      })
    }catch(e){
      console.error(e)
    }
  })

  afterEach(function (done) {
    this.robot.shutdown()
    done()
  })

  describe('Unit Tests', function () {
    describe('#http', function () {
      it('persists the url passed in', function () {
        const url = `http://${domain}`
        const httpClient = this.robot.http(url)
        expect(httpClient.url).to.equal(url)
      })

      it('actually responds to an http get request', function (done) {
        const url = `http://${domain}:${this.robot.port}`
        const httpClient = this.robot.http(url)
        this.robot.router.get('/', (req, res) => {
          res.end()
        })

        httpClient.get().then(response => {
          expect(response.error).to.be.null
          expect(response.body).to.not.be.null
          expect(response.res.headers['x-powered-by']).to.be.equal(`hubot/${this.robot.name}`)
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('actually does a post', function (done) {
        const url = `http://${domain}:${this.robot.port}/1`
        const httpClient = this.robot.http(url, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        this.robot.router.post('/:id', (req, res) => {
          expect(req.params.id).to.be.equal('1')
          expect(req.body.name).to.be.equal('jg')
          res.json(req.body)
        })
        httpClient.post('name=jg').then(response => {
          expect(response.error).to.be.null
          expect(response.res.statusCode).to.be.equal(200)
          expect(JSON.parse(response.body).name).to.be.equal('jg')  
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('passes options through to the ScopedHttpClient', function () {
        const agent = {}
        const httpClient = this.robot.http(`http://${domain}`, { agent })
        expect(httpClient.options.agent).to.equal(agent)
      })

      it('sets a sane user agent', function () {
        const agent = {}
        const httpClient = this.robot.http(`http://${domain}`, { agent })
        expect(httpClient.options.headers['User-Agent']).to.contain('Hubot')
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
      it('calls all registered listeners', function (done) {
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

        this.robot.receive(testMessage).then(_ => {
          // When no listeners match, each listener is called twice: once with
          // the original message and once with a CatchAll message
          expect(listener.call).to.have.callCount(8)  
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('sends a CatchAllMessage if no listener matches', function (done) {
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
        oldReceive.call(this.robot, testMessage).then(_ => {
          expect(this.robot.receive).to.have.been.called
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('does not trigger a CatchAllMessage if a listener matches', function (done) {
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
        oldReceive.call(this.robot, testMessage).then(_ => {          
          // Ensure the function did not recurse
          expect(this.robot.receive).to.not.have.been.called
        })
        .catch(e => console.error(e))
        .finally(done)

      })

      it('stops processing if a listener marks the message as done', function (done) {
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

        this.robot.receive(testMessage).then(_ => {
          expect(listenerSpy.call).to.not.have.been.called
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('gracefully handles listener uncaughtExceptions (move on to next listener)', function (done) {
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

        this.robot.receive(testMessage).then(_ => {
          expect(this.robot.emit).to.have.been.called
          expect(goodListenerCalled).to.be.ok
        })
        .catch(e => console.error(e))
        .finally(done)
      })
    })

    describe('#loadFile', function () {
      beforeEach(function () {
        this.sandbox = sinon.sandbox.create()
      })

      afterEach(function (done) {
        this.sandbox.restore()
        done()
      })

      it('should load .mjs files in the scripts folder', function (done) {
        this.robot.loadMjsFile(`${__dirname}test-script.mjs`).then(module => {
          expect(module.default).to.be.a('function')
        })
        .catch(e => console.error(e))
        .finally(done)
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
    it('calls a matching listener', function (done) {
      const testMessage = new TextMessage(this.user, 'message123')
      this.robot.hear(/^message123$/, function (response) {
        expect(response.message).to.equal(testMessage)
        done()
      })
      this.robot.receive(testMessage).then(_ => {

      })
      .catch(e => console.error(e))
    })

    it('calls multiple matching listeners', function (done) {
      const testMessage = new TextMessage(this.user, 'message123')

      let listenersCalled = 0
      const listenerCallback = function (response) {
        expect(response.message).to.equal(testMessage)
        listenersCalled++
      }

      this.robot.hear(/^message123$/, listenerCallback)
      this.robot.hear(/^message123$/, listenerCallback)

      this.robot.receive(testMessage).then(_ => {
        expect(listenersCalled).to.equal(2)
      })
      .catch(e => console.error(e))
      .finally(done)
    })

    it('calls the catch-all listener if no listeners match', function (done) {
      const testMessage = new TextMessage(this.user, 'message123')

      const listenerCallback = sinon.spy()
      this.robot.hear(/^no-matches$/, listenerCallback)

      this.robot.catchAll(function (response) {
        expect(listenerCallback).to.not.have.been.called
        expect(response.message).to.equal(testMessage)
        done()
      })

      this.robot.receive(testMessage).then(_ => {})
      .catch(e => console.error(e))
    })

    it('does not call the catch-all listener if any listener matched', function (done) {
      const testMessage = new TextMessage(this.user, 'message123')

      const listenerCallback = sinon.spy()
      this.robot.hear(/^message123$/, listenerCallback)

      const catchAllCallback = sinon.spy()
      this.robot.catchAll(catchAllCallback)

      this.robot.receive(testMessage).then(_ => {
        expect(listenerCallback).to.have.been.called.once
        expect(catchAllCallback).to.not.have.been.called
      })
      .catch(e => console.error(e))
      .finally(done)
    })

    it('stops processing if message.finish() is called synchronously', function (done) {
      const testMessage = new TextMessage(this.user, 'message123')

      this.robot.hear(/^message123$/, response => response.message.finish())

      const listenerCallback = sinon.spy()
      this.robot.hear(/^message123$/, listenerCallback)

      this.robot.receive(testMessage).then(_ => {
        expect(listenerCallback).to.not.have.been.called
      })
      .catch(e => console.error(e))
      .finally(done)
    })

    it('calls non-TextListener objects', function (done) {
      const testMessage = new EnterMessage(this.user)

      this.robot.enter(function (response) {
        expect(response.message).to.equal(testMessage)
        done()
      })

      this.robot.receive(testMessage)
      .then(_ => {})
      .catch(e => console.error(e))
    })

    it('gracefully handles listener uncaughtExceptions (move on to next listener)', function (done) {
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

      this.robot.receive(testMessage).then(_ => {
        expect(this.robot.emit).to.have.been.called
        expect(goodListenerCalled).to.be.ok  
      })
      .catch(e => console.error(e))
      .finally(done)
    })

    describe('Listener Middleware', function () {
      it('allows listener callback execution', function (done) {
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.listenerMiddleware((context) =>{
          expect(context).to.be.ok
        })

        const testMessage = new TextMessage(this.user, 'message123')
        this.robot.receive(testMessage).then(_ => {
          expect(listenerCallback).to.have.been.called
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('can block listener callback execution', function (done) {
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.listenerMiddleware((context) => {
          // Block Listener callback execution
          context.response.message.done = true
          expect(context.response).to.be.ok
        })

        const testMessage = new TextMessage(this.user, 'message123')
        this.robot.receive(testMessage).then(_ => {
          expect(listenerCallback).to.not.have.been.called
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('receives the correct arguments', function (done) {
        this.robot.hear(/^message123$/, function () {})
        const testListener = this.robot.listeners[0]
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.listenerMiddleware((context) => {
          expect(context.listener).to.equal(testListener)
          expect(context.response.message).to.equal(testMessage)
        })

        this.robot.receive(testMessage).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)
      })
    })

    describe('Receive Middleware', function () {
      it('fires for all messages, including non-matching ones', function (done) {
        const middlewareSpy = sinon.spy()
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.receiveMiddleware(function (context) {
          middlewareSpy()
        })

        const testMessage = new TextMessage(this.user, 'not message 123')

        this.robot.receive(testMessage).then(_ => {
          expect(listenerCallback).to.not.have.been.called
          expect(middlewareSpy).to.have.been.called
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('can block listener execution', function (done) {
        const middlewareSpy = sinon.spy()
        const listenerCallback = sinon.spy()
        this.robot.hear(/^message123$/, listenerCallback)
        this.robot.receiveMiddleware(function (r, context) {
          // Block Listener callback execution
          middlewareSpy()
          context.response.message.done = true
        })

        const testMessage = new TextMessage(this.user, 'message123')
        this.robot.receive(testMessage).then(_ => {
          expect(listenerCallback).to.not.have.been.called
          expect(middlewareSpy).to.have.been.called
        })
        .catch(e => console.error(e))
        .finally(done)
      })

      it('receives the correct arguments', function (done) {
        this.robot.hear(/^message123$/, function () {})
        const testMessage = new TextMessage(this.user, 'message123')

        this.robot.receiveMiddleware(function (_, context) {
          expect(context.response.message).to.equal(testMessage)
        })

        this.robot.receive(testMessage).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)
      })

      it('allows editing the message portion of the given response', function (done) {
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
        this.robot.receive(testMessage).then(_ => {
          expect(testCallback).to.have.been.called
        })
        .catch(e => console.error(e))
        .finally(done)
      })
    })

    describe('Response Middleware', function () {
      it('executes response middleware in order', function (done) {
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
        this.robot.receive(testMessage).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)
      })

      it('allows replacing outgoing strings', function (done) {
        this.robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))

        this.robot.responseMiddleware(function (context) {
          context.strings = ['whatever I want.']
        })

        const testMessage = new TextMessage(this.user, 'message123')
        this.robot.adapter.send = async function(envelope, ...strings){
          expect(strings[0]).to.equal('whatever I want.')
        }
        this.robot.receive(testMessage).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)
      })

      it('marks plaintext as plaintext', function (done) {
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
        const testMessage2 = new TextMessage(this.user, 'message456')
        this.robot.receive(testMessage).then(_ => {
          expect(plaintext).to.equal(true)
          expect(method).to.equal('send')
          this.robot.receive(testMessage2).then(_ => {
            expect(plaintext).to.equal(undefined)
            expect(method).to.equal('play')
          })
          .catch(e => console.error(e))
          .finally(done)
        })
        .catch(e => console.error(e))
      })
    })
  })
})
