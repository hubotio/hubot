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
        debug () {}
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
      it('calls the matcher', function (done) {
        const callback = sinon.spy()
        const testMatcher = sinon.spy()
        const testMessage = {}

        const testListener = new Listener(this.robot, testMatcher, callback)
        testListener.call(testMessage, function (_) {
          expect(testMatcher).to.have.been.calledWith(testMessage)
          done()
        })
      })

      it('passes the matcher result on to the listener callback', async function() {
        const matcherResult = {}
        const testMatcher = sinon.stub().returns(matcherResult)
        const testMessage = {}
        const listenerCallback = response => expect(response.match).to.be.equal(matcherResult)
        // sanity check; matcherResult must be truthy
        expect(matcherResult).to.be.ok
        const testListener = new Listener(this.robot, testMatcher, listenerCallback)

        const result = await testListener.call(testMessage)
        
        expect(result).to.be.ok
        expect(testMatcher).to.have.been.called
      })

      describe('if the matcher returns true', function () {
        beforeEach(function () {
          this.createListener = function (cb) {
            return new Listener(this.robot, sinon.stub().returns(true), cb)
          }
        })

        it('executes the listener callback', async function () {
          const listenerCallback = sinon.spy()
          const testMessage = {}

          const testListener = this.createListener(listenerCallback)
          await testListener.call(testMessage)
          expect(listenerCallback).to.have.been.called
        })

        it('returns true', function () {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          const result = testListener.call(testMessage)
          expect(result).to.be.ok
        })

        it('calls the provided callback with true', async function () {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          const result = await testListener.call(testMessage)
          expect(result).to.be.ok
        })

        it('calls the provided callback after the function returns', async function () {
          const testMessage = {}
          let finished = false
          const testListener = this.createListener(function () {
            finished = true
          })
          const result = await testListener.call(testMessage)
          expect(finished).to.be.ok
        })

        it('handles uncaught errors from the listener callback', async function () {
          const testMessage = {}
          const theError = new Error()

          const listenerCallback = function (response) {
            throw theError
          }

          this.robot.emit = function (name, err) {
            expect(name).to.equal('error')
            expect(err).to.equal(theError)
          }

          const testListener = this.createListener(listenerCallback)
          const response = await testListener.call(testMessage, sinon.spy())
          expect(response.message).to.equal(testMessage)

        })

        it('calls the provided callback with true if there is an error thrown by the listener callback', async function () {
          const testMessage = {}
          const theError = new Error()

          const listenerCallback = function (response) {
            throw theError
          }

          const testListener = this.createListener(listenerCallback)
          const result = await testListener.call(testMessage)
          expect(result).to.be.ok
        })

        it('calls the listener callback with a Response that wraps the Message', function (done) {
          const testMessage = {}

          const listenerCallback = function (response) {
            expect(response.message).to.equal(testMessage)
            done()
          }

          const testListener = this.createListener(listenerCallback)

          testListener.call(testMessage, sinon.spy())
        })

        it('passes through the provided middleware stack', async function () {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          const testMiddleware = {
            async execute (context) {
              expect(context.listener).to.be.equal(testListener)
              expect(context.response).to.be.instanceof(Response)
              expect(context.response.message).to.be.equal(testMessage)
            }
          }

          await testListener.call(testMessage, testMiddleware, sinon.spy())
        })

        it('executes the listener callback if middleware succeeds', async function () {
          const listenerCallback = sinon.spy()
          const testMessage = {}

          const testListener = this.createListener(listenerCallback)

          const result = await testListener.call(testMessage)
          expect(listenerCallback).to.have.been.called
          // Matcher matched, so we true
          expect(result).to.be.ok
        })

        it('does not execute the listener callback if middleware fails', async function () {
          const listenerCallback = sinon.spy()
          const testMessage = {}

          const testListener = this.createListener(listenerCallback)
          const testMiddleware = {
            execute (context) {
              // Middleware fails
              throw new Error("Middleware failed")
            }
          }

          const result = await testListener.call(testMessage, testMiddleware)
          expect(listenerCallback).to.not.have.been.called
          // Matcher still matched, so we true
          expect(result).to.be.ok

        })
      })

      describe('if the matcher returns false', function () {
        beforeEach(function () {
          this.createListener = function (cb) {
            return new Listener(this.robot, sinon.stub().returns(false), cb)
          }
        })

        it('does not execute the listener callback', async function () {
          const listenerCallback = sinon.spy()
          const testMessage = {}

          const testListener = this.createListener(listenerCallback)
          const result = await testListener.call(testMessage)
          expect(listenerCallback).to.not.have.been.called
        })

        it('returns false', async function () {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          const result = await testListener.call(testMessage)
          expect(result).to.not.be.ok
        })

        it('calls the provided callback with false', async function () {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          const result = await testListener.call(testMessage)
          expect(result).to.not.be.ok
        })

        it('does not call the provided callback after the function returns', async function () {
          const testMessage = {}
          let finished = false
          const testListener = this.createListener(function () {
            finished = true
          })
          const result = await testListener.call(testMessage)
          expect(finished).to.not.be.ok
        })

        it('does not execute any middleware', async function () {
          const testMessage = {}

          const testListener = this.createListener(function () {})
          const testMiddleware = { execute: sinon.spy() }

          const result = await testListener.call(testMessage)
          expect(testMiddleware.execute).to.not.have.been.called
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
