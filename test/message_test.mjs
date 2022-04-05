'use strict'

/* global describe, beforeEach, it */
/* eslint-disable no-unused-expressions */

// Assertions and Stubbing
import chai from 'chai'
import cs from 'sinon-chai'
import User from '../src/user.mjs'
import { Message, TextMessage } from '../src/message.mjs'
chai.use(cs)

const expect = chai.expect

describe('Message', function () {
  beforeEach(function () {
    this.user = new User({
      id: 1,
      name: 'hubottester',
      room: '#mocha'
    })
  })

  describe('Unit Tests', function () {
    describe('#finish', () =>
      it('marks the message as done', function () {
        const testMessage = new Message(this.user)
        expect(testMessage.done).to.not.be.ok
        testMessage.finish()
        expect(testMessage.done).to.be.ok
      })
    )

    describe('TextMessage', () =>
      describe('#match', () =>
        it('should perform standard regex matching', function () {
          const testMessage = new TextMessage(this.user, 'message123')
          expect(testMessage.match(/^message123$/)).to.be.ok
          expect(testMessage.match(/^does-not-match$/)).to.not.be.ok
        })
      )
    )
  })
})
