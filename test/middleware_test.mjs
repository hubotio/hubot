'use strict'

/* global describe, beforeEach, it, afterEach */
/* eslint-disable no-unused-expressions */

// Assertions and Stubbing
import chai from 'chai'
import sinon from 'sinon'
import cs from 'sinon-chai'
import Robot from '../src/robot.mjs'
import { TextMessage } from '../src/message.mjs'
import Response from '../src/response.mjs'
import Middleware from '../src/middleware.mjs'
import mockery from 'mockery'
import mockAdapter from './fixtures/mock-adapter.mjs'

chai.use(cs)

const expect = chai.expect

describe('Middleware', function () {
  describe('Unit Tests', function () {
    beforeEach(function () {
      // Stub out event emitting
      this.robot = { emit: sinon.spy() }
      this.middleware = new Middleware(this.robot)
    })

    describe('#execute', function () {
      it('executes synchronous middleware', async function () {
        const testMiddleware = sinon.spy((context) => {
          expect(context).to.be.ok
        })
        const middlewareFinished = function (r, c) {
          expect(testMiddleware).to.have.been.called
        }
        this.middleware.register(testMiddleware)
        this.middleware.register(middlewareFinished)
        await this.middleware.execute({})
      })

      it('executes asynchronous middleware', async function () {
        const testMiddleware = sinon.spy(async (context) =>
          expect(context).to.be.ok
        )

        const middlewareFinished = async function (context) {
          expect(testMiddleware).to.have.been.called
        }
        this.middleware.register(testMiddleware)
        this.middleware.register(middlewareFinished)

        await this.middleware.execute({})
      })

      it('passes the correct arguments to each middleware', async function () {
        const testContext = {}
        const testMiddleware = (r, context) => {
          expect(context).to.equal(testContext)
        }
        this.middleware.register(testMiddleware)
        await this.middleware.execute(testContext)
      })

      it('executes all registered middleware in definition order', async function () {
        const middlewareExecution = []

        const testMiddlewareA = (r, context) => {
          middlewareExecution.push('A')
        }

        const testMiddlewareB = function (r, context) {
          middlewareExecution.push('B')
        }

        this.middleware.register(testMiddlewareA)
        this.middleware.register(testMiddlewareB)
        const middlewareFinished = function () {
          expect(middlewareExecution).to.deep.equal(['A', 'B'])
        }
        this.middleware.register(middlewareFinished)
        this.middleware.execute({})
      })

      describe('error handling', function () {
        it('does not execute subsequent middleware after the error is thrown', async function () {
          const middlewareExecution = []

          const testMiddlewareA = function (context) {
            middlewareExecution.push('A')
          }

          const testMiddlewareB = function (context) {
            middlewareExecution.push('B')
            throw new Error()
          }

          const testMiddlewareC = function (context) {
            middlewareExecution.push('C')
          }

          this.middleware.register(testMiddlewareA)
          this.middleware.register(testMiddlewareB)
          this.middleware.register(testMiddlewareC)

          const middlewareFinished = sinon.spy()
          const middlewareFailed = () => {
            expect(middlewareFinished).to.not.have.been.called
            expect(middlewareExecution).to.deep.equal(['A', 'B'])
          }
          this.middleware.register(middlewareFailed)

          this.middleware.execute({})
        })

        it('emits an error event', async function () {
          const testResponse = {}
          const theError = new Error()

          const testMiddleware = function (context) {
            throw theError
          }

          this.middleware.register(testMiddleware)

          this.robot.emit = sinon.spy(function (name, err, response) {
            expect(name).to.equal('error')
            expect(err).to.equal(theError)
            expect(response).to.equal(testResponse)
          })

          const middlewareFailed = () => {
            expect(this.robot.emit).to.have.been.called
          }
          this.middleware.register(middlewareFailed)
          this.middleware.execute({ response: testResponse })
        })
      })
    })

    describe('#register', function () {
      it('adds to the list of middleware', function () {
        const testMiddleware = function (context, next, done) {}

        this.middleware.register(testMiddleware)

        expect(this.middleware.stack).to.include(testMiddleware)
      })
    })
  })

  // Per the documentation in docs/scripting.md
  // Any new fields that are exposed to middleware should be explicitly
  // tested for.
  describe('Public Middleware APIs', function () {
    beforeEach(async function() {
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false
      })
      mockery.registerMock('hubot-mock-adapter', mockAdapter)
      this.robot = new Robot(null, 'mock-adapter', true, 'TestHubot')
      await this.robot.loadAdapter('mock-adapter')
      this.robot.onUncaughtException = err => {
        return this.robot.emit('error', err)
      }
      process.on('uncaughtException', this.robot.onUncaughtException)

      // Re-throw AssertionErrors for clearer test failures
      this.robot.on('error', function (name, err, response) {
        if (__guard__(err != null ? err.constructor : undefined, x => x.name) === 'AssertionError') {
          process.nextTick(function () {
            throw err
          })
        }
      })

      this.robot.run()
      this.user = this.robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      })

      // Dummy middleware
      this.middleware = sinon.spy((context) => {
        return
      })

      this.testMessage = new TextMessage(this.user, 'message123')
      this.robot.hear(/^message123$/, function (response) {})
      this.testListener = this.robot.listeners[0]
    })

    afterEach(function () {
      mockery.disable()
      this.robot.shutdown()
    })

    describe('listener middleware context', function () {
      beforeEach(function () {
        this.robot.listenerMiddleware((context, next, done) => {
          this.middleware(context, next, done)
        })
      })

      describe('listener', function () {
        it('is the listener object that matched', async function () {
          await this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('listener',
                sinon.match.same(this.testListener)))
          })
        })

        it('has options.id (metadata)', async function () {
          await this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('listener',
                sinon.match.has('options',
                  sinon.match.has('id'))))
          })
        })
      })

      describe('response', () =>
        it('is a Response that wraps the message', async function () {
          await this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(sinon.match.has('response', sinon.match.instanceOf(Response).and(sinon.match.has('message', sinon.match.same(this.testMessage)))))
          })
        })
      )
    })

    describe('receive middleware context', function () {
      beforeEach(function () {
        this.robot.receiveMiddleware((context) => {
          this.middleware(context)
        })
      })

      describe('response', () =>
        it('is a match-less Response object', async function () {
          await this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('response',
                sinon.match.instanceOf(Response).and(
                  sinon.match.has('message',
                    sinon.match.same(this.testMessage)))))
          })
        })
      )
    })

    describe('next', function () {
      beforeEach(function () {
        this.robot.listenerMiddleware((context) => {
          this.middleware(context)
        })
      })

      it('is a function with arity one', async function () {
        await this.robot.receive(this.testMessage, () => {
          expect(this.middleware).to.have.been.calledWithMatch(sinon.match.any)
        })
      })
    })

    describe('done', function () {
      beforeEach(function () {
        this.robot.listenerMiddleware((context) => {
          this.middleware(context)
        })
      })

      it('is a function with arity zero', async function () {
        await this.robot.receive(this.testMessage, () => {
          expect(this.middleware).to.have.been.calledWithMatch(sinon.match.any)
        })
      })
    })
  })
})

function __guard__ (value, transform) {
  (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
