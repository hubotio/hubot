'use strict'

import { TextMessage, Robot, Response, Middleware, User} from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, test, expect} from 'bun:test'

function makeDummyResponse(){
  return new Response(new Robot(), new TextMessage(new User(1), 'testing middleware', 0, null))
}

describe('Middleware', () => {
  describe('Unit Tests', () => {
    describe('#execute', () => {
      test('executes synchronous middleware', async ()=>{
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

      test('executes asynchronous middleware', async ()=> {
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
      test('executes all registered middleware in definition order', async () => {
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
        expect(middlewareExecution).toEqual(new Set(['A', 'B']))
      })

      describe('error handling', () => {
        test('does not execute subsequent middleware after the error is thrown', async () => {
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
          expect(middlewareExecution).toEqual(new Set(['A', 'B']))
        })

        test('emits an error event', async () => {
          const theError = new Error()
          const testMiddleware = async (robot, response) => {
            throw theError
          }
          const robot = new Robot()
          const middleware = new Middleware(robot)
          middleware.register(testMiddleware)
          let wasCalled = false
          robot.on(Robot.EVENTS.ERROR, (err, response) => {
            expect(err).toBe(theError)
            expect(response instanceof Response).toEqual(true)
            wasCalled = true
          })
          await middleware.execute(makeDummyResponse())
          expect(wasCalled).toBeTruthy()
        })
      })
    })
  })
})