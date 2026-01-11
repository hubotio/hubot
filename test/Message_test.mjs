'use strict'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { User, Message, TextMessage } from '../index.mjs'

describe('Message', () => {
  const user = new User({
    id: 1,
    name: 'hubottester',
    room: '#mocha',
    displayName: 'Admin'
  })

  describe('Unit Tests', () => {
    describe('#finish', () =>
      it('marks the message as done', () => {
        const testMessage = new Message(user)
        assert.deepEqual(testMessage.done, false)
        testMessage.finish()
        assert.deepEqual(testMessage.done, true)
      })
    )

    describe('TextMessage', () =>
      describe('#match', () =>
        it('should perform standard regex matching', () => {
          const testMessage = new TextMessage(user, 'message123')
          assert.equal(testMessage.match(/^message123$/)[0], 'message123')
          assert.deepEqual(testMessage.match(/^does-not-match$/), null)
        })
      )
    )
  })
})
