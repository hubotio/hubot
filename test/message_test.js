'use strict'

/* eslint-disable no-unused-expressions */

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

// Hubot classes
const User = require('../src/user')
const Message = require('../src/message').Message
const TextMessage = require('../src/message').TextMessage

describe('Message', () => {
  const user = new User({
    id: 1,
    name: 'hubottester',
    room: '#mocha'
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
