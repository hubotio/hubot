'use strict'

/* global describe, beforeEach, it */
/* eslint-disable no-unused-expressions */

// Assertions and Stubbing
const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))

const expect = chai.expect

// Hubot classes
const EnterMessage = require('../src/message').EnterMessage
const TextMessage = require('../src/message').TextMessage
const Listener = require('../src/listener').Listener
const TextListener = require('../src/listener').TextListener
const Response = require('../src/response')
const User = require('../src/user')
const Middleware = require('../src/middleware')

describe('Listener', function () {
  beforeEach(function () {
    // Dummy robot
    this.robot = {
      // Re-throw AssertionErrors for clearer test failures
      emit (name, err, response) {
        if (err.constructor.name === 'AssertionError') {
          return process.nextTick(function () {
            throw err
          })
        }
      },
      // Ignore log messages
      logger: {
        debug () {},
        error (...args) {
          // console.error(...args)
        }
      },
      // Why is this part of the Robot object??
      Response
    }

    // Test user
    this.user = new User({
      id: 1,
      name: 'hubottester',
      room: '#mocha'
    })
  })

  describe('Unit Tests', function () {
    describe('#call', function () {
      it('calls the matcher', async function () {
        const testMessage = new TextMessage(this.user, 'message')
        const testMatcher = message => {
          expect(message).to.be.equal(testMessage)
          return true
        }
        const middleware = new Middleware(this.robot)
        middleware.register(async context => {
          expect(context.listener).to.be.equal(testListener)
        })
        const testListener = new Listener(this.robot, testMatcher, async response => true)
        await testListener.call(testMessage, middleware)
      })

      it('the response object should have the match results so listeners can have access to it', async function () {
        const matcherResult = {}
        const testMatcher = message => {
          return matcherResult
        }
        const testMessage = new TextMessage(this.user, 'response should have match')
        const listenerCallback = response => expect(response.match).to.be.equal(matcherResult)
        const testListener = new Listener(this.robot, testMatcher, listenerCallback)
        await testListener.call(testMessage, null)
      })

      describe('if the matcher returns true', function () {
        beforeEach(function () {
          this.createListener = function (cb) {
            return new Listener(this.robot, () => true, cb)
          }
        })

        it('executes the listener callback', async function () {
          const listenerCallback = async response => {
            expect(response.message).to.be.equal(testMessage)
          }
          const testMessage = {}

          const testListener = this.createListener(listenerCallback)
          await testListener.call(testMessage, async function (_) {})
        })

        it('returns true', function () {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          const result = testListener.call(testMessage)
          expect(result).to.be.ok
        })

        it('calls the provided callback with true', function (done) {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          testListener.call(testMessage, function (result) {
            expect(result).to.be.ok
            done()
          })
        })

        it('calls the provided callback after the function returns', function (done) {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          let finished = false
          testListener.call(testMessage, function (result) {
            expect(finished).to.be.ok
            done()
          })
          finished = true
        })

        it('handles uncaught errors from the listener callback', async function () {
          const testMessage = {}
          const theError = new Error()

          const listenerCallback = async response => {
            throw theError
          }

          this.robot.emit = function (name, err, response) {
            expect(name).to.equal('error')
            expect(err).to.equal(theError)
            expect(response.message).to.equal(testMessage)
          }

          const testListener = this.createListener(listenerCallback)
          await testListener.call(testMessage, async response => {})
        })

        it('calls the provided callback with true if there is an error thrown by the listener callback', function (done) {
          const testMessage = {}
          const theError = new Error()

          const listenerCallback = function (response) {
            throw theError
          }

          const testListener = this.createListener(listenerCallback)
          testListener.call(testMessage, function (result) {
            expect(result).to.be.ok
            done()
          })
        })

        it('calls the listener callback with a Response that wraps the Message', async function () {
          const testMessage = {}
          const listenerCallback = async response => {
            expect(response.message).to.equal(testMessage)
          }
          const testListener = this.createListener(listenerCallback)
          await testListener.call(testMessage, async response => {})
        })

        it('passes through the provided middleware stack', async function () {
          const testMessage = {}
          const testListener = this.createListener(function () {})
          const testMiddleware = {
            execute (context, next, done) {
              expect(context.listener).to.be.equal(testListener)
              expect(context.response).to.be.instanceof(Response)
              expect(context.response.message).to.be.equal(testMessage)
              expect(next).to.be.a('function')
              expect(done).to.be.a('function')
            }
          }

          await testListener.call(testMessage, testMiddleware)
        })

        it('executes the listener callback if middleware succeeds', async function () {
          const listenerCallback = sinon.spy()
          const testMessage = {}

          const testListener = this.createListener(listenerCallback)

          await testListener.call(testMessage, function (result) {
            expect(result).to.be.ok
          })
          expect(listenerCallback).to.have.been.called
        })

        it('does not execute the listener callback if middleware fails', async function () {
          const listenerCallback = sinon.spy()
          const testMessage = {}

          const testListener = this.createListener(listenerCallback)
          const testMiddleware = {
            async execute (context) {
              return false
            }
          }

          await testListener.call(testMessage, testMiddleware, function (result) {
            expect(result).to.be.ok
          })
          expect(listenerCallback).to.not.have.been.called
        })
      })

      describe('if the matcher returns false', function () {
        beforeEach(function () {
          this.createListener = function (cb) {
            return new Listener(this.robot, () => false, cb)
          }
        })

        it('does not execute the listener callback', async function () {
          const listenerCallback = sinon.spy()
          const testMessage = {}

          const testListener = this.createListener(listenerCallback)
          await testListener.call(testMessage, async context => {
            expect(listenerCallback).to.not.have.been.called
          })
        })

        it('returns null', async function () {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          const result = await testListener.call(testMessage)
          expect(result).to.be.null
        })

        it('returns null because there is no matched listener', async function () {
          const testMessage = {}
          const testListener = this.createListener(function () {})
          const middleware = sinon.spy(new Middleware(this.robot).execute)
          const result = await testListener.call(testMessage, middleware)
          expect(result).to.be.null
          expect(middleware).to.not.have.been.called
        })

        it('does not execute any middleware', async function () {
          const testMessage = {}
          const testListener = this.createListener(function () {})
          const testMiddleware = { execute: sinon.spy() }
          await testListener.call(testMessage, result => {
            expect(testMiddleware.execute).to.not.have.been.called
          })
        })
      })
    })

    describe('#constructor', function () {
      it('requires a matcher', () => expect(function () {
        return new Listener(this.robot, undefined, {}, sinon.spy())
      }).to.throw(Error))

      it('requires a callback', function () {
        // No options
        expect(function () {
          return new Listener(this.robot, sinon.spy())
        }).to.throw(Error)
        // With options
        expect(function () {
          return new Listener(this.robot, sinon.spy(), {})
        }).to.throw(Error)
      })

      it('gracefully handles missing options', function () {
        const testMatcher = sinon.spy()
        const listenerCallback = sinon.spy()
        const testListener = new Listener(this.robot, testMatcher, listenerCallback)
        // slightly brittle because we are testing for the default options Object
        expect(testListener.options).to.deep.equal({ id: null })
        expect(testListener.callback).to.be.equal(listenerCallback)
      })

      it('gracefully handles a missing ID (set to null)', function () {
        const testMatcher = sinon.spy()
        const listenerCallback = sinon.spy()
        const testListener = new Listener(this.robot, testMatcher, {}, listenerCallback)
        expect(testListener.options.id).to.be.null
      })
    })

    describe('TextListener', () =>
      describe('#matcher', function () {
        it('matches TextMessages', function () {
          const callback = sinon.spy()
          const testMessage = new TextMessage(this.user, 'test')
          testMessage.match = sinon.stub().returns(true)
          const testRegex = /test/

          const testListener = new TextListener(this.robot, testRegex, callback)
          const result = testListener.matcher(testMessage)

          expect(result).to.be.ok
          expect(testMessage.match).to.have.been.calledWith(testRegex)
        })

        it('does not match EnterMessages', function () {
          const callback = sinon.spy()
          const testMessage = new EnterMessage(this.user)
          testMessage.match = sinon.stub().returns(true)
          const testRegex = /test/

          const testListener = new TextListener(this.robot, testRegex, callback)
          const result = testListener.matcher(testMessage)

          expect(result).to.not.be.ok
          expect(testMessage.match).to.not.have.been.called
        })
      })
    )
  })
})
