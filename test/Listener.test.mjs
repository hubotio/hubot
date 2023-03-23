'use strict'

import { EnterMessage, TextMessage, Listener, TextListener, Response, User, Robot } from '../index.mjs'
import assert from 'node:assert/strict'
import test from 'bun:test'

const makeRobot = ()=>{
  const robot = new Robot()
  return robot
}

await test('Listener', async (t)=> {
  await t.test('Unit Tests', async (t)=>{
    await t.test('#call', async (t)=> {
      await t.test('calls the matcher', async () => {
        const robot = makeRobot()
        const testMessage = {}
        const testMatcher = message=>{
          assert.deepEqual(message, testMessage)
          return false
        }

        const testListener = new Listener(robot, testMatcher, async response=>{})
        const response = await testListener.call(testMessage, didMatch => {
          assert.deepEqual(didMatch, false)
        })
      })

      await t.test('passes the matcher result on to the listener callback', async () => {
        const robot = makeRobot()
        const testMessage = {
          text: 'testing matcher result'
        }
        const matcherResult = /testing (?<result>.*)/.exec(testMessage.text)
        const testMatcher = message=>{
          assert.ok(true)
          return /testing (?<result>.*)/.exec(message.text)
        }
        const listenerCallback = async response => assert.deepEqual(response.match, matcherResult)
        const testListener = new Listener(robot, testMatcher, listenerCallback)
        const response = await testListener.call(testMessage)
        assert.ok(response)
      })

      await t.test('if the matcher returns true', async (t) => {
        await t.test('executes the listener callback', async (t) => {
          const robot = makeRobot()
          const listenerCallback = async response => {
            assert.deepEqual(response.match.groups.result, 'something')
          }
          const testMessage = {
            text: 'testing something'
          }
          const testMatcher = message=>{
            assert.ok(true)
            return /testing (?<result>.*)/.exec(message.text)
          }  
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          await testListener.call(testMessage)
        })

        await t.test('calls the provided callback after the function returns', async (t) => {
          const robot = makeRobot()
          let finished = false
          const listenerCallback = async response => {
            finished = true
          }
          const testMessage = {
            text: 'testing something'
          }
          const testMatcher = message=>{
            return /testing (?<result>.*)/.exec(message.text)
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          const response = await testListener.call(testMessage)
          assert.deepEqual(finished, true)
        })

        await t.test('handles uncaught errors from the listener callback', async (t) => {
          const robot = makeRobot()
          const theError = new Error()
          const listenerCallback = response => {
            throw theError
          }
          const testMessage = {
            text: 'testing something'
          }
          const testMatcher = message=>{
            return /testing (?<result>.*)/.exec(message.text)
          }
          robot.on(Robot.EVENTS.ERROR, (err, message) => {
            assert.deepEqual(message, testMessage)
            assert.deepEqual(err, theError)
          })
          robot.listen(testMatcher, listenerCallback)
          await robot.receive(testMessage)
        })
        await t.test('calls the listener callback with a Response that wraps the Message', async (t) => {
          const robot = makeRobot()
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            assert.deepEqual(response.message, testMessage)
          }
          const testMatcher = message=>{
            return /testing (?<result>.*)/.exec(message.text)
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          await testListener.call(testMessage, ()=>{})
        })

        await t.test('passes through the provided middleware stack', async (t) => {
          const robot = makeRobot()
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {}
          const testMatcher = message=>{
            return /testing (?<result>.*)/.exec(message.text)
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          
          const testMiddleware = {
            async execute(response) {
              assert.ok(response instanceof Response)
              assert.deepEqual(response.message, testMessage)
            }
          }
          await testListener.call(testMessage, testMiddleware, ()=>{})
        })

        await t.test('does not execute the listener callback if middleware fails', async (t) => {
          const robot = makeRobot()
          robot.on('error', (err, response)=>{})
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            assert.fail('Should not have been called')
          }
          const testMatcher = message=>{
            return /testing (?<result>.*)/.exec(message.text)
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          const testMiddleware = {
            execute (response) {
              throw new Error('Middleware failed')
            }
          }
          const response = await testListener.call(testMessage, testMiddleware)
          assert.ok(response)
        })      
      })

      await t.test('if the matcher returns false', async (t) => {
        await t.test('does not execute the listener callback', async (t) => {
          const robot = makeRobot()
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            assert.fail('Should not have been called')
          }
          const testMatcher = message=>{
            return false
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          const result = await testListener.call(testMessage)
        })

        await t.test('returns false', async (t) => {
          const robot = makeRobot()
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            assert.fail('Should not have been called')
          }
          const testMatcher = message=>{
            return false
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          const result = await testListener.call(testMessage)
          assert.ok(!result)
        })

        await t.test('does not call the provided callback after the function returns', async (t) => {
          const robot = makeRobot()
          let finished = false
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            finished = true
          }
          const testMatcher = message=>{
            return false
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          const result = await testListener.call(testMessage)
          assert.deepEqual(finished, false)
        })
      })
    })

    await t.test('TextListener', async (t) =>
      await t.test('#matcher', async (t) => {
        await t.test('matches TextMessages', async (t) => {
          const robot = makeRobot()
          const user = new User(1)
          const callback = ()=>{}
          const testMessage = new TextMessage(user, 'test')
          testMessage.match = regex=>{
            assert.deepEqual(regex, testRegex)
            return regex.exec(testMessage.text)
          }
          const testRegex = /test/
          const testListener = new TextListener(robot, testRegex, callback)
          const result = testListener.matcher(testMessage)
          assert.ok(result)
        })

        await t.test('does not match EnterMessages', async (t) => {
          const callback = ()=>{}
          const robot = makeRobot()
          const user = new User(1)

          const testMessage = new EnterMessage(user)
          testMessage.match = regex => {
            assert.fail('Should not be called')
          }
          const testRegex = /test/
          const testListener = new TextListener(robot, testRegex, callback)
          const result = testListener.matcher(testMessage)
          assert.ok(!result)
        })
      })
    )
  })
})