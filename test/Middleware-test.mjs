'use strict'

import { TextMessage, Robot, Response, Middleware, User} from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

function makeDummyResponse(){
  return new Response(new Robot(), new TextMessage(new User(1), 'testing middleware', 0, null))
}

describe('Middleware', () => {
  describe('Unit Tests', () => {
    describe('#execute', () => {
      it('executes synchronous middleware', async ()=>{
        const testMiddleware = (robot, response) => {
          assert.ok(response)
          return true
        }
        const middlewareFinished = (robot, response) => {
          assert.ok(response)
          return true
        }
        const middleware = new Middleware(new Robot())
        middleware.register(testMiddleware)
        middleware.register(middlewareFinished)
        await middleware.execute({})
      })

      it('executes asynchronous middleware', async ()=> {
        const testMiddleware = async (robot, response) => {
          assert.ok(response)
          return true
        }
        const middlewareFinished = async (robot, response) => {
          assert.ok(response)
          return true
        }
        const middleware = new Middleware(new Robot())
        middleware.register(testMiddleware)
        middleware.register(middlewareFinished)
        await middleware.execute(makeDummyResponse())
      })
      it('executes all registered middleware in definition order', async () => {
        const middleware = new Middleware(new Robot())
        const middlewareExecution = new Set()
        const testMiddlewareA = async (robot, response) => {
          middlewareExecution.add('A')
          return true
        }
        const testMiddlewareB = async (robot, response) => {
          middlewareExecution.add('B')
          return true
        }
        const testMiddlewareC = async (robot, response) => {
          return true
        }
        middleware.register(testMiddlewareA)
        middleware.register(testMiddlewareB)
        middleware.register(testMiddlewareC)
        await middleware.execute(makeDummyResponse())
        assert.deepEqual(middlewareExecution, new Set(['A', 'B']))
      })

      describe('error handling', () => {
        it('does not execute subsequent middleware after the error is thrown', async () => {
          const middlewareExecution = new Set()
          const testMiddlewareA = async (robot, response) => {
            middlewareExecution.add('A')
            return true
          }
          const testMiddlewareB = async (robot, response) => {
            middlewareExecution.add('B')
            throw new Error('Expected to error and stop execution')
          }

          const testMiddlewareC = async (robot, response) => {
            middlewareExecution.add('C')
            return true
          }
          const middleware = new Middleware(new Robot())
          
          const middlewareFinished = ()=>{
            assert.fail('Should not be called')
          }

          middleware.register(testMiddlewareA)
          middleware.register(testMiddlewareB)
          middleware.register(testMiddlewareC)
          middleware.register(middlewareFinished)
          await middleware.execute(makeDummyResponse())
          assert.deepEqual(middlewareExecution, new Set(['A', 'B']))
        })

        it('emits an error event', async () => {
          const theError = new Error()
          const testMiddleware = async (robot, response) => {
            throw theError
          }
          const robot = new Robot()
          const middleware = new Middleware(robot)
          middleware.register(testMiddleware)
          let wasCalled = false
          robot.on(Robot.EVENTS.ERROR, (err, response) => {
            assert.deepEqual(err, theError)
            assert.ok(response instanceof Response)
            wasCalled = true
          })
          await middleware.execute(makeDummyResponse())
          assert.ok(wasCalled)
        })
      })
    })
  })
})