'use strict'
import { Message, TextMessage, User } from '../index.mjs'
import {describe, test, expect} from 'bun:test'

describe('Message', () => {
  describe('Unit Tests', () => {
    describe('#finish', () =>
    test('marks the message as done', async () => {
        const user = new User(1)
        const testMessage = new Message(user)
        expect(testMessage.done).toBe(false)
        testMessage.finish()
        expect(testMessage.done).toBe(true)
      })
    )

    describe('TextMessage', () =>
      describe('#match', () =>
      test('should perform standard regex matching', async () => {
          const user = new User(1)
          const testMessage = new TextMessage(user, 'message123')
          expect(testMessage.match(/^message123$/)).toEqual(['message123'])
          expect(testMessage.match(/^does-not-match$/)).toEqual(null)
        })
      )
    )
  })
})
