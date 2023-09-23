'use strict'

/* eslint-disable no-unused-expressions */

const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')

// Hubot classes
const Robot = require('../src/robot')
const TextMessage = require('../src/message').TextMessage
const Response = require('../src/response')
const Middleware = require('../src/middleware')

const { hook, reset } = require('./fixtures/RequireMocker.js')

describe('Middleware', () => {
  describe('Unit Tests', () => {
    let robot = null
    let middleware = null
    beforeEach(() => {
      robot = { emit () {} }
      middleware = new Middleware(robot)
    })

    describe('#execute', () => {
      it('executes synchronous middleware', async () => {
        let wasCalled = false
        const testMiddleware = async context => {
          wasCalled = true
          return true
        }
        middleware.register(testMiddleware)
        await middleware.execute({})
        assert.deepEqual(wasCalled, true)
      })

      it('executes all registered middleware in definition order', async () => {
        const middlewareExecution = []
        const testMiddlewareA = async context => {
          middlewareExecution.push('A')
        }
        const testMiddlewareB = async context => {
          middlewareExecution.push('B')
        }
        middleware.register(testMiddlewareA)
        middleware.register(testMiddlewareB)
        await middleware.execute({})
        assert.deepEqual(middlewareExecution, ['A', 'B'])
      })

      describe('error handling', () => {
        it('does not execute subsequent middleware after the error is thrown', async () => {
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

          middleware.register(testMiddlewareA)
          middleware.register(testMiddlewareB)
          middleware.register(testMiddlewareC)
          await middleware.execute({})
          assert.deepEqual(middlewareExecution, ['A', 'B'])
        })
      })
    })

    describe('#register', () => {
      it('adds to the list of middleware', () => {
        const testMiddleware = async context => {}
        middleware.register(testMiddleware)
        assert.ok(middleware.stack.includes(testMiddleware))
      })

      it('validates the arity of middleware', () => {
        const testMiddleware = async (context, next, done, extra) => {}

        assert.throws(() => middleware.register(testMiddleware), 'Incorrect number of arguments')
      })
    })
  })

  // Per the documentation in docs/scripting.md
  // Any new fields that are exposed to middleware should be explicitly
  // tested for.
  describe('Public Middleware APIs', () => {
    let robot = null
    let user = null
    let testListener = null
    let testMessage = null
    beforeEach(async () => {
      hook('hubot-mock-adapter', require('./fixtures/mock-adapter.js'))
      robot = new Robot('hubot-mock-adapter', false, 'TestHubot')
      await robot.loadAdapter()
      await robot.run

      // Re-throw AssertionErrors for clearer test failures
      robot.on('error', function (err, response) {
        if (__guard__(err != null ? err.constructor : undefined, x => x.name) === 'AssertionError') {
          process.nextTick(() => {
            throw err
          })
        }
      })

      user = robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      })
      testMessage = new TextMessage(user, 'message123')
      robot.hear(/^message123$/, async response => {})
      testListener = robot.listeners[0]
    })

    afterEach(() => {
      reset()
      robot.shutdown()
    })

    describe('listener middleware context', () => {
      describe('listener', () => {
        it('is the listener object that matched, has metadata in options object with id', async () => {
          robot.listenerMiddleware(async context => {
            assert.deepEqual(context.listener, testListener)
            assert.ok(context.listener.options)
            assert.deepEqual(context.listener.options.id, null)
            return true
          })
          await robot.receive(testMessage)
        })
      })

      describe('response', () =>
        it('is a Response that wraps the message', async () => {
          robot.listenerMiddleware(async context => {
            assert.ok(context.response instanceof Response)
            assert.ok(context.response.message)
            assert.deepEqual(context.response.message, testMessage)
            return true
          })
          await robot.receive(testMessage)
        })
      )
    })

    describe('receive middleware context', () => {
      describe('response', () => {
        it('is a match-less Response object', async () => {
          robot.receiveMiddleware(async context => {
            assert.ok(context.response instanceof Response)
            assert.ok(context.response.message)
            assert.deepEqual(context.response.message, testMessage)
            return true
          })

          await robot.receive(testMessage)
        })
      })
    })
  })
})

function __guard__ (value, transform) {
  (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
