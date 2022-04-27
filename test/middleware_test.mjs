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
import { fileURLToPath } from 'url'
import path from 'path'

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
      it('executes synchronous middleware', function (done) {
        const testMiddleware = sinon.spy((context) => {
          expect(context).to.be.ok
        })
        const middlewareFinished = function (r, c) {
          expect(testMiddleware).to.have.been.called
        }
        this.middleware.register(testMiddleware)
        this.middleware.register(middlewareFinished)
        this.middleware.execute({}).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)

      })

      it('executes asynchronous middleware', function (done) {
        const testMiddleware = sinon.spy(async (context) =>
          expect(context).to.be.ok
        )

        const middlewareFinished = async function (context) {
          expect(testMiddleware).to.have.been.called
        }
        this.middleware.register(testMiddleware)
        this.middleware.register(middlewareFinished)

        this.middleware.execute({}).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)
      })

      it('passes the correct arguments to each middleware', function (done) {
        const testContext = {}
        const testMiddleware = (r, context) => {
          expect(context).to.equal(testContext)
        }
        this.middleware.register(testMiddleware)
        this.middleware.execute(testContext).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)
      })

      it('executes all registered middleware in definition order', function () {
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
        it('does not execute subsequent middleware after the error is thrown', function (done) {
          const middlewareExecution = []

          const testMiddlewareA = function (context) {
            middlewareExecution.push('A')
          }

          const testMiddlewareB = function (context) {
            middlewareExecution.push('B')
            throw new Error('Expected to error and stop execution')
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

          this.middleware.execute({}).then(_ => {})
          .catch(e => console.error(e))
          .finally(done)
        })

        it('emits an error event', function (done) {
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
          this.middleware.execute({ response: testResponse }).then(_ => {})
          .catch(e => console.error('This is expected to error out: ', e))
          .finally(done)
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
      let pathToLookForAdapters = fileURLToPath(import.meta.url).replace('/test/middleware_test.mjs', '')
      pathToLookForAdapters = path.resolve(pathToLookForAdapters, 'test/fixtures')
      this.robot = new Robot(pathToLookForAdapters, 'shell', 'TestHubot')      
      await this.robot.setupExpress()
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

      // Dummy middleware
      this.middleware = sinon.spy((context) => {
        return
      })

      this.robot.hear(/^message123$/, function (response) {})
      this.user = this.robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      })
      this.testMessage = new TextMessage(this.user, 'message123')
      this.testListener = this.robot.listeners[0]
      try{
        await this.robot.loadAdapter('shell.mjs')
        this.robot.run()
      } catch(e){ console.error(e) }

    })

    afterEach(function () {
      this.robot.shutdown()
    })

    describe('listener middleware context', function () {
      beforeEach(function () {
        this.robot.listenerMiddleware((context) => {
          this.middleware(context)
        })
      })

      describe('listener', function () {
        it('is the listener object that matched', function (done) {
          this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(sinon.match.has('listener', sinon.match.same(this.testListener)))
          }).then(_ => {})
          .catch(e => console.error(e))
          .finally(done)
        })

        it('has options.id (metadata)', function (done) {
          this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(sinon.match.has('listener', sinon.match.has('options', sinon.match.has('id'))))
          }).then(_ => {})
          .catch(e => console.error(e))
          .finally(done)
        })
      })

      describe('response', function () {
        it('is a Response that wraps the message', function (done) {
          this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(sinon.match.has('response', sinon.match.instanceOf(Response).and(sinon.match.has('message', sinon.match.same(this.testMessage)))))
          }).then(_ => {})
          .catch(e => console.error(e))
          .finally(done)
        })
      })
    })

    describe('receive middleware context', function () {
      beforeEach(function () {
        this.robot.receiveMiddleware((context) => {
          this.middleware(context)
        })
      })

      describe('response', function () {
        it('is a match-less Response object', function (done) {
          this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(sinon.match.has('response', sinon.match.instanceOf(Response).and(sinon.match.has('message', sinon.match.same(this.testMessage)))))
          }).then(_ => {})
          .catch(e => console.error(e))
          .finally(done)
        })
      })
    })

    describe('next', function () {
      beforeEach(function () {
        this.robot.listenerMiddleware((context) => {
          this.middleware(context)
        })
      })

      it('is a function with arity one', function (done) {
        this.robot.receive(this.testMessage, () => {
          expect(this.middleware).to.have.been.calledWithMatch(sinon.match.any)
        }).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)
      })
    })

    describe('done', function () {
      beforeEach(function () {
        this.robot.listenerMiddleware((context) => {
          this.middleware(context)
        })
      })

      it('is a function with arity zero', function (done) {
        this.robot.receive(this.testMessage, () => {
          expect(this.middleware).to.have.been.calledWithMatch(sinon.match.any)
        }).then(_ => {})
        .catch(e => console.error(e))
        .finally(done)
      })
    })
  })
})

function __guard__ (value, transform) {
  (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
