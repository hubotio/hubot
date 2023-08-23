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
const TextMessage = require('../src/message').TextMessage
const Response = require('../src/response')
const Middleware = require('../src/middleware')

const { hook, reset } = require('./fixtures/RequireMocker.js')

describe('Middleware', function () {
  describe('Unit Tests', function () {
    beforeEach(function () {
      // Stub out event emitting
      this.robot = { emit: sinon.spy() }

      this.middleware = new Middleware(this.robot)
    })

    describe('#execute', function () {
      it('executes synchronous middleware', async function () {
        const testMiddleware = sinon.spy(async context => {
          return true
        })
        this.middleware.register(testMiddleware)
        await this.middleware.execute({})
        expect(testMiddleware).to.have.been.called
      })

      it('executes all registered middleware in definition order', async function () {
        const middlewareExecution = []
        const testMiddlewareA = async context => {
          middlewareExecution.push('A')
        }
        const testMiddlewareB = async context => {
          middlewareExecution.push('B')
        }
        this.middleware.register(testMiddlewareA)
        this.middleware.register(testMiddlewareB)
        await this.middleware.execute({})
        expect(middlewareExecution).to.deep.equal(['A', 'B'])
      })

      describe('error handling', function () {
        it('does not execute subsequent middleware after the error is thrown', async function () {
          const middlewareExecution = []

          const testMiddlewareA = async context => {
            middlewareExecution.push('A')
          }

          const testMiddlewareB = async context => {
            middlewareExecution.push('B')
            throw new Error()
          }

          const testMiddlewareC = async context => {
            middlewareExecution.push('C')
          }

          this.middleware.register(testMiddlewareA)
          this.middleware.register(testMiddlewareB)
          this.middleware.register(testMiddlewareC)
          await this.middleware.execute({})
          expect(middlewareExecution).to.deep.equal(['A', 'B'])
        })
      })
    })

    describe('#register', function () {
      it('adds to the list of middleware', function () {
        const testMiddleware = async context => {}
        this.middleware.register(testMiddleware)
        expect(this.middleware.stack).to.include(testMiddleware)
      })

      it('validates the arity of middleware', function () {
        const testMiddleware = function (context, next, done, extra) {}

        expect(() => this.middleware.register(testMiddleware)).to.throw(/Incorrect number of arguments/)
      })
    })
  })

  // Per the documentation in docs/scripting.md
  // Any new fields that are exposed to middleware should be explicitly
  // tested for.
  describe('Public Middleware APIs', function () {
    beforeEach(async function () {
      hook('hubot-mock-adapter', require('./fixtures/mock-adapter.js'))
      process.env.EXPRESS_PORT = 0
      this.robot = new Robot('hubot-mock-adapter', true, 'TestHubot')
      await this.robot.loadAdapter()
      this.robot.run

      // Re-throw AssertionErrors for clearer test failures
      this.robot.on('error', function (err, response) {
        if (__guard__(err != null ? err.constructor : undefined, x => x.name) === 'AssertionError') {
          process.nextTick(function () {
            throw err
          })
        }
      })

      this.user = this.robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      })

      // Dummy middleware
      this.middleware = sinon.spy((context, next, done) => next(done))

      this.testMessage = new TextMessage(this.user, 'message123')
      this.robot.hear(/^message123$/, function (response) {})
      this.testListener = this.robot.listeners[0]
    })

    afterEach(function () {
      reset()
      this.robot.shutdown()
    })

    describe('listener middleware context', function () {
      beforeEach(function () {
        this.robot.listenerMiddleware(async context => {
          await this.middleware(context)
        })
      })

      describe('listener', function () {
        it('is the listener object that matched', async function () {
          await this.robot.receive(this.testMessage)
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.has('listener',
              sinon.match.same(this.testListener)) // context
          )
        })

        it('has options.id (metadata)', async function () {
          await this.robot.receive(this.testMessage)
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.has('listener',
              sinon.match.has('options',
                sinon.match.has('id'))) // context
          )
        })
      })

      describe('response', () =>
        it('is a Response that wraps the message', async function () {
          await this.robot.receive(this.testMessage)
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.has('response',
              sinon.match.instanceOf(Response).and(
                sinon.match.has('message',
                  sinon.match.same(this.testMessage)))) // context
          )
        })
      )
    })

    describe('receive middleware context', function () {
      beforeEach(function () {
        this.robot.receiveMiddleware(async context => {
          await this.middleware(context)
        })
      })

      describe('response', () =>
        it('is a match-less Response object', async function () {
          await this.robot.receive(this.testMessage)
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.has('response',
              sinon.match.instanceOf(Response).and(
                sinon.match.has('message',
                  sinon.match.same(this.testMessage)))) // context
          )
        })
      )
    })
  })
})

function __guard__ (value, transform) {
  (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
