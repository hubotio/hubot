'use strict'

import { TextMessage, Robot, Response, Middleware} from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, it, beforeEach, afterEach} from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const makeRobot = ()=>{
  const robot = new Robot()
  return robot
}

describe('Middleware', () => {
  describe('Unit Tests', () => {
    describe('#execute', () => {
      it('executes synchronous middleware', async ()=>{
        const testMiddleware = context => {
          assert.ok(context)
        }
        const middlewareFinished = (r, c) => {
          assert.ok(r)
        }
        const middleware = new Middleware(makeRobot())
        middleware.register(testMiddleware)
        middleware.register(middlewareFinished)
        await middleware.execute({})
      })

      it('executes asynchronous middleware', async ()=> {
        const testMiddleware = async context => assert.ok(context)
        const middlewareFinished = async context => assert.ok(context)
        const middleware = new Middleware(makeRobot())
        middleware.register(testMiddleware)
        middleware.register(middlewareFinished)
        await middleware.execute({})
      })

      it('passes the correct arguments to each middleware', async () => {
        const testContext = {}
        const testMiddleware = (r, context) => {
          assert.deepEqual(context, testContext)
        }
        const middleware = new Middleware(makeRobot())
        middleware.register(testMiddleware)
        await middleware.execute(testContext)
      })

      it('executes all registered middleware in definition order', async () => {
        const middlewareExecution = []
        const testMiddlewareA = (r, context) => {
          middlewareExecution.push('A')
        }
        const testMiddlewareB = (r, context) => {
          middlewareExecution.push('B')
        }
        const middleware = new Middleware(makeRobot())
        middleware.register(testMiddlewareA)
        middleware.register(testMiddlewareB)
        const middlewareFinished = () => {
          assert.deepEqual(middlewareExecution, ['A', 'B'])
        }
        middleware.register(middlewareFinished)
        await middleware.execute({})
      })

      describe('error handling', () => {
        it('does not execute subsequent middleware after the error is thrown', async () => {
          const middlewareExecution = []
          const testMiddlewareA = context => {
            middlewareExecution.push('A')
          }
          const testMiddlewareB = context => {
            middlewareExecution.push('B')
            throw new Error('Expected to error and stop execution')
          }

          const testMiddlewareC = context => {
            middlewareExecution.push('C')
          }
          const middleware = new Middleware(makeRobot())
          middleware.register(testMiddlewareA)
          middleware.register(testMiddlewareB)
          middleware.register(testMiddlewareC)

          const middlewareFinished = ()=>{
            assert.fail('Should not be called')
          }
          const middlewareFailed = () => {
            assert.deepEqual(middlewareExecution, ['A', 'B'])
          }
          middleware.register(middlewareFailed)
          await middleware.execute({})
        })

        it('emits an error event', async () => {
          const testResponse = {}
          const theError = new Error()
          const testMiddleware = context => {
            throw theError
          }
          const robot = makeRobot()
          const middleware = new Middleware(robot)
          middleware.register(testMiddleware)
          let wasCalled = false
          robot.emit = (name, err, response) => {
            assert.deepEqual(name, 'error')
            assert.deepEqual(err, theError)
            assert.deepEqual(response, testResponse)
            wasCalled = true
          }

          const middlewareFailed = () => {
            assert.ok(wasCalled)
          }
          middleware.register(middlewareFailed)
          try{
            await middleware.execute({ response: testResponse })
          }catch(e){
            console.error('This is expected to error out: ', e)
          }
        })
      })
    })

    describe('#register', () => {
      it('adds to the list of middleware', async () => {
        const testMiddleware = (context, next, done) => {}
        const middleware = new Middleware(makeRobot())
        middleware.register(testMiddleware)
        console.log(middleware.stack)
        assert.ok(middleware.stack.some(s => s == testMiddleware))
      })
    })
  })

  // Per the documentation in docs/scripting.md
  // Any new fields that are exposed to middleware should be explicitly
  // tested for.
  describe('Public Middleware APIs', () => {
    let robot = null
    let user = null
    let testMessage = null
    let testListener = null
    beforeEach(async () => {
      let pathToLookForAdapters = fileURLToPath(import.meta.url).replace('/test/middleware_test.mjs', '')
      pathToLookForAdapters = path.resolve(pathToLookForAdapters, 'test/fixtures')
      robot = new Robot(pathToLookForAdapters, 'shell', 'TestHubot')      
      await robot.setupExpress()
      robot.onUncaughtException = err => {
        return robot.emit('error', err)
      }
      process.on('uncaughtException', robot.onUncaughtException)

      // Re-throw AssertionErrors for clearer test failures
      robot.on('error', function (name, err, response) {
        if (__guard__(err != null ? err.constructor : undefined, x => x.name) === 'AssertionError') {
          process.nextTick(function () {
            throw err
          })
        }
      })

      robot.hear(/^message123$/, function (response) {})
      user = robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      })
      testMessage = new TextMessage(user, 'message123')
      testListener = robot.listeners[0]
      try{
        await robot.loadAdapter('shell.mjs')
        robot.run()
      } catch(e){ console.error(e) }
      middleware = new Middleware(robot)
    })

    afterEach(() => {
      robot.shutdown()
    })
  })
})

function __guard__ (value, transform) {
  (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
