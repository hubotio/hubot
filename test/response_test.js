'use strict'

// Assertions and Stubbing
const chai = require('chai')
const expect = chai.expect

// Hubot classes
const User = require('../src/user')
const Robot = require('../src/robot')
const TextMessage = require('../src/message').TextMessage
const Response = require('../src/response')

const asyncMiddleware = (context, next, done) => {
  this.runOrder.push('middleware started')
  setTimeout(() => {
    this.runOrder.push('middleware finished')
    next(done)
  }, 100)
}

// mock `hubot-mock-adapter` module from fixture
const mockery = require('mockery')

describe('Response', function () {
  describe('Unit Tests', function () {
    beforeEach(function () {
      // setup mock robot
      this.user = new User({
        id: 1,
        name: 'hubottester',
        room: '#mocha'
      })
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false
      })
      mockery.registerMock('hubot-mock-adapter', require('./fixtures/mock-adapter'))
      this.robot = new Robot(null, 'mock-adapter', true, 'TestHubot')
      this.robot.alias = 'Hubot'
      this.robot.run()

      // async delayed middleware for promise return tests

      // create a mock message and match
      const message = new TextMessage(this.user, 'Hubot message123')
      const regex = /(.*)/
      const pattern = this.robot.respondPattern(regex)
      const match = message.match(pattern)[1]

      // generate response with mocks
      this.res = new Response(this.robot, message, match)

      // utility for tracking order of execution
      this.runOrder = []

      // sends don't send, just log
      this.robot.send = x => this.runOrder.push(`sent ${x}`)
    })

    afterEach(function () {
      this.robot.shutdown()
    })

    describe('#reply', function () {
      context('with asynchronous middleware', function () {
        beforeEach(function () {
          this.robot.responseMiddleware((context, next, done) => asyncMiddleware.bind(this, context, next, done))
        })

        it('without using returned promise, .reply executes and continues before middleware completed', function () {
          const _self = this

          _self.runOrder.push('reply sending')
          _self.res.reply('test')
          _self.runOrder.push('reply finished')
          expect(_self.runOrder).to.eql([
            'reply sending',
            'reply finished'
          ])
        })

        it('using returned promise.then, .reply waits for middleware to complete before continueing', function () {
          const _self = this

          _self.runOrder.push('reply sending')
          _self.res.reply('test')
          .then(() => _self.runOrder.push('reply finished'))
          .then(() => {
            expect(_self.runOrder).to.eql([
              'reply sending',
              'middleware started',
              'middleware finished',
              'reply finished'
            ])
          })
        })
      })
    })
  })
})
