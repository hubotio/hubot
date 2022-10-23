'use strict'
import { Message, TextMessage, User } from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

describe('Message', () => {
  describe('Unit Tests', () => {
    describe('#finish', () =>
      it('marks the message as done', async () => {
        const user = new User(1)
        const testMessage = new Message(user)
        assert.ok(!testMessage.done)
        testMessage.finish()
        assert.ok(testMessage.done)
      })
    )

    describe('TextMessage', () =>
      describe('#match', () =>
        it('should perform standard regex matching', async () => {
          const user = new User(1)
          const testMessage = new TextMessage(user, 'message123')
          assert.ok(testMessage.match(/^message123$/))
          assert.ok(!testMessage.match(/^does-not-match$/))
        })
      )
    )
  })
})
