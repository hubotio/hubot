'use strict'

import { EnterMessage, TextMessage, Listener, TextListener, Response, User, Robot } from '../index.mjs'
import assert from 'node:assert/strict'
import {test, describe, expect} from 'bun:test'

const makeRobot = ()=>{
  const robot = new Robot()
  return robot
}

await describe('Listener', async ()=> {
  await describe('Unit Tests', async ()=>{
    await describe('#call', async ()=> {
      await test('calls the matcher', async () => {
        const robot = makeRobot()
        const testMessage = {}
        const testMatcher = message=>{
          expect(message).toEqual(testMessage)
          return false
        }

        const testListener = new Listener(robot, testMatcher, async response=>{})
        const response = await testListener.call(testMessage, didMatch => {
          expect(didMatch).toEqual(false)
        })
      })

      await test('passes the matcher result on to the listener callback', async () => {
        const robot = makeRobot()
        const testMessage = {
          text: 'testing matcher result'
        }
        const matcherResult = /testing (?<result>.*)/.exec(testMessage.text)
        const testMatcher = message=>{
          expect(true).toEqual(true)
          return /testing (?<result>.*)/.exec(message.text)
        }
        const listenerCallback = async response => expect(response.match).toEqual(matcherResult)
        const testListener = new Listener(robot, testMatcher, listenerCallback)
        const response = await testListener.call(testMessage)
        expect(response).toBeTruthy()
      })

      await describe('if the matcher returns true', async () => {
        await test('executes the listener callback', async () => {
          const robot = makeRobot()
          const listenerCallback = async response => {
            expect(response.match.groups.result).toEqual('something')
          }
          const testMessage = {
            text: 'testing something'
          }
          const testMatcher = message=>{
            expect(true).toEqual(true)
            return /testing (?<result>.*)/.exec(message.text)
          }  
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          await testListener.call(testMessage)
        })

        await test('calls the provided callback after the function returns', async () => {
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
          expect(finished).toEqual(true)
        })

        await test('handles uncaught errors from the listener callback', async () => {
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
            expect(message).toEqual(testMessage)
            expect(err).toBe(theError)
          })
          robot.listen(testMatcher, listenerCallback)
          await robot.receive(testMessage)
        })
        await test('calls the listener callback with a Response that wraps the Message', async () => {
          const robot = makeRobot()
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            expect(response.message).toBe(testMessage)
          }
          const testMatcher = message=>{
            return /testing (?<result>.*)/.exec(message.text)
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          await testListener.call(testMessage, ()=>{})
        })

        await test('passes through the provided middleware stack', async () => {
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
              expect(response instanceof Response).toEqual(true)
              expect(response.message).toBe(testMessage)
            }
          }
          await testListener.call(testMessage, testMiddleware, ()=>{})
        })

        await test('does not execute the listener callback if middleware fails', async () => {
          const robot = makeRobot()
          robot.on('error', (err, response)=>{})
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            expect(true).toEqual(false)
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
          expect(response).toBeTruthy()
        })      
      })

      await describe('if the matcher returns false', async () => {
        await test('does not execute the listener callback', async () => {
          const robot = makeRobot()
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            expect(true).toEqual(false)
          }
          const testMatcher = message=>{
            return false
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          const result = await testListener.call(testMessage)
          expect(result).toBeNull()
        })

        await test('returns false', async () => {
          const robot = makeRobot()
          const testMessage = {
            text: 'testing something'
          }
          const listenerCallback = response => {
            expect(true).toEqual(false)
          }
          const testMatcher = message=>{
            return false
          }
          const testListener = new Listener(robot, testMatcher, listenerCallback)
          const result = await testListener.call(testMessage)
          expect(result).toBeFalsy()
        })

        await test('does not call the provided callback after the function returns', async () => {
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
          expect(finished).toEqual(false)
        })
      })
    })

    await describe('TextListener', async () =>
      await describe('#matcher', async () => {
        await test('matches TextMessages', async () => {
          const robot = makeRobot()
          const user = new User(1)
          const callback = ()=>{}
          const testMessage = new TextMessage(user, 'test')
          testMessage.match = regex=>{
            expect(regex).toBe(testRegex)
            return regex.exec(testMessage.text)
          }
          const testRegex = /test/
          const testListener = new TextListener(robot, testRegex, callback)
          const result = testListener.matcher(testMessage)
          expect(result).toBeTruthy()
        })

        await test('does not match EnterMessages', async () => {
          const callback = ()=>{}
          const robot = makeRobot()
          const user = new User(1)

          const testMessage = new EnterMessage(user)
          testMessage.match = regex => {
            expect(true).toEqual(false)
            assert.fail('Should not be called')
          }
          const testRegex = /test/
          const testListener = new TextListener(robot, testRegex, callback)
          const result = testListener.matcher(testMessage)
          expect(result).toBeFalsy()
        })
      })
    )
  })
})