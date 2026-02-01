'use strict'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EnterMessage, TextMessage, Listener, TextListener, Response, User, Middleware } from '../index.mjs'

describe('Listener', () => {
  const robot = {
    // Re-throw AssertionErrors for clearer test failures
    emit (name, err, response) {
      if (err.constructor.name === 'AssertionError') {
        return process.nextTick(() => {
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
  const user = new User({
    id: 1,
    name: 'hubottester',
    room: '#mocha'
  })

  describe('Unit Tests', () => {
    describe('#call', () => {
      it('calls the matcher', async () => {
        const testMessage = new TextMessage(user, 'message')
        const testMatcher = message => {
          assert.deepEqual(message, testMessage)
          return true
        }
        const middleware = new Middleware(robot)
        middleware.register(async context => {
          assert.deepEqual(context.listener, testListener)
        })
        const testListener = new Listener(robot, testMatcher, async response => true)
        await testListener.call(testMessage, middleware)
      })

      it('the response object should have the match results so listeners can have access to it', async () => {
        const matcherResult = {}
        const testMatcher = message => {
          return matcherResult
        }
        const testMessage = new TextMessage(user, 'response should have match')
        const listenerCallback = response => assert.deepEqual(response.match, matcherResult)
        const testListener = new Listener(robot, testMatcher, listenerCallback)
        await testListener.call(testMessage, null)
      })

      describe('if the matcher returns true', () => {
        const createListener = cb => {
          return new Listener(robot, () => true, cb)
        }

        it('executes the listener callback', async () => {
          const listenerCallback = async response => {
            assert.deepEqual(response.message, testMessage)
          }
          const testMessage = {}

          const testListener = createListener(listenerCallback)
          await testListener.call(testMessage, async (_) => {})
        })

        it('returns true', () => {
          const testMessage = {}

          const testListener = createListener(() => {})
          const result = testListener.call(testMessage)
          assert.ok(result)
        })

        it('calls the provided callback with true', (t, done) => {
          const testMessage = {}

          const testListener = createListener(() => {})
          testListener.call(testMessage, async result => {
            assert.ok(result)
            done()
          })
        })

        it('calls the provided callback after the function returns', (t, done) => {
          const testMessage = {}

          const testListener = createListener(() => {})
          let finished = false
          testListener.call(testMessage, async result => {
            assert.ok(finished)
            done()
          })
          finished = true
        })

        it('handles uncaught errors from the listener callback', async () => {
          const testMessage = {}
          const theError = new Error()

          const listenerCallback = async response => {
            throw theError
          }

          robot.emit = (name, err, response) => {
            assert.equal(name, 'error')
            assert.deepEqual(err, theError)
            assert.deepEqual(response.message, testMessage)
          }

          const testListener = createListener(listenerCallback)
          await testListener.call(testMessage, async response => {})
        })

        it('calls the provided callback with true if there is an error thrown by the listener callback', (t, done) => {
          const testMessage = {}
          const theError = new Error()

          const listenerCallback = async response => {
            throw theError
          }

          const testListener = createListener(listenerCallback)
          testListener.call(testMessage, async result => {
            assert.ok(result)
            done()
          })
        })

        it('calls the listener callback with a Response that wraps the Message', async () => {
          const testMessage = {}
          const listenerCallback = async response => {
            assert.deepEqual(response.message, testMessage)
          }
          const testListener = createListener(listenerCallback)
          await testListener.call(testMessage, async response => {})
        })

        it('passes through the provided middleware stack', async () => {
          const testMessage = {}
          const testListener = createListener(async () => {})
          const testMiddleware = {
            execute (context, next, done) {
              assert.deepEqual(context.listener, testListener)
              assert.ok(context.response instanceof Response)
              assert.deepEqual(context.response.message, testMessage)
              assert.ok(typeof next === 'function')
              assert.ok(typeof done === 'function')
            }
          }

          await testListener.call(testMessage, testMiddleware)
        })

        it('executes the listener callback if middleware succeeds', async () => {
          let wasCalled = false
          const listenerCallback = async () => {
            wasCalled = true
          }
          const testMessage = {}

          const testListener = createListener(listenerCallback)

          await testListener.call(testMessage, async result => {
            assert.ok(result)
          })
          assert.deepEqual(wasCalled, true)
        })

        it('does not execute the listener callback if middleware fails', async () => {
          let wasCalled = false
          const listenerCallback = async () => {
            wasCalled = true
          }
          const testMessage = {}

          const testListener = createListener(listenerCallback)
          const testMiddleware = {
            async execute (context) {
              return false
            }
          }

          await testListener.call(testMessage, testMiddleware, async result => {
            assert.ok(result)
          })
          assert.deepEqual(wasCalled, false)
        })
      })

      describe('if the matcher returns false', () => {
        const createListener = cb => {
          return new Listener(robot, () => false, cb)
        }

        it('does not execute the listener callback', async () => {
          let wasCalled = false
          const listenerCallback = async () => {
            wasCalled = true
          }
          const testMessage = {}

          const testListener = createListener(listenerCallback)
          await testListener.call(testMessage, async context => {
            assert.deepEqual(wasCalled, false)
          })
        })

        it('returns null', async () => {
          const testMessage = {}

          const testListener = createListener(async () => {})
          const result = await testListener.call(testMessage)
          assert.deepEqual(result, null)
        })

        it('returns null because there is no matched listener', async () => {
          const testMessage = {}
          const testListener = createListener(async () => {})
          const middleware = context => {
            throw new Error('Should not be called')
          }
          const result = await testListener.call(testMessage, middleware)
          assert.deepEqual(result, null)
        })
      })
    })

    describe('#constructor', () => {
      it('requires a matcher', () => {
        assert.throws(() => {
          return new Listener(robot, undefined, {}, async () => {})
        }, Error)
      })

      it('requires a callback', () => {
        // No options
        assert.throws(() => {
          return new Listener(robot, () => {})
        }, Error)
        // With options
        assert.throws(() => {
          return new Listener(robot, () => {}, {})
        }, Error)
      })

      it('gracefully handles missing options', () => {
        const testMatcher = () => {}
        const listenerCallback = async () => {}
        const testListener = new Listener(robot, testMatcher, listenerCallback)
        // slightly brittle because we are testing for the default options Object
        assert.deepEqual(testListener.options, { id: null })
        assert.deepEqual(testListener.callback, listenerCallback)
      })

      it('gracefully handles a missing ID (set to null)', () => {
        const testMatcher = () => {}
        const listenerCallback = async () => {}
        const testListener = new Listener(robot, testMatcher, {}, listenerCallback)
        assert.deepEqual(testListener.options.id, null)
      })
    })

    describe('TextListener', () =>
      describe('#matcher', () => {
        it('matches TextMessages', () => {
          const callback = async () => {}
          const testMessage = new TextMessage(user, 'test')

          testMessage.match = regex => {
            assert.deepEqual(regex, testRegex)
            return true
          }
          const testRegex = /test/

          const testListener = new TextListener(robot, testRegex, callback)
          const result = testListener.matcher(testMessage)

          assert.ok(result)
        })

        it('does not match EnterMessages', () => {
          const callback = async () => {}
          const testMessage = new EnterMessage(user)
          const testRegex = /test/

          const testListener = new TextListener(robot, testRegex, callback)
          const result = testListener.matcher(testMessage)

          assert.deepEqual(result, undefined)
        })

        it('matches non-TextMessage objects with a match function (duck-typing regression test)', () => {
          const callback = async () => {}
          const testRegex = /test/
          // Simulate a message from a linked module that isn't an instanceof TextMessage
          const nonTextMessage = {
            user: 'testuser',
            text: 'test message',
            match (regex) {
              assert.deepEqual(regex, testRegex)
              return true
            }
          }

          const testListener = new TextListener(robot, testRegex, callback)
          const result = testListener.matcher(nonTextMessage)

          assert.ok(result)
        })
      })
    )
  })
})
