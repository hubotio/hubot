'use strict'

/* global describe, beforeEach, it */

const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))

const expect = chai.expect

const Robot = require('../src/robot')

describe('Shell Adapter', function () {
  beforeEach(function () {
    this.robot = new Robot(null, 'shell', false, 'TestHubot')
    this.robot.run()
  })

  this.afterEach(function () {
    this.robot.shutdown()
  })

  describe('Public API', function () {
    beforeEach(function () {
      this.adapter = this.robot.adapter
    })

    it('assigns robot', function () {
      expect(this.adapter.robot).to.equal(this.robot)
    })

    it('sends a message', function () {
      this.adapter.send = sinon.spy()
      this.adapter.send({ room: 'general' }, 'hello')

      expect(this.adapter.send).to.have.been.calledWith({ room: 'general' }, 'hello')
    })

    it('emotes a message', function () {
      this.adapter.send = sinon.spy()
      this.adapter.emote({ room: 'general' }, 'hello')

      expect(this.adapter.send).to.have.been.calledWith({ room: 'general' }, '* hello')
    })

    it('replies to a message', function () {
      this.adapter.send = sinon.spy()
      this.adapter.reply({ room: 'general', user: { name: 'mocha' } }, 'hello')

      expect(this.adapter.send).to.have.been.calledWith({ room: 'general', user: { name: 'mocha' } }, 'mocha: hello')
    })

    it('runs the adapter and emits connected', function (done) {
      const connected = () => {
        this.adapter.off('connected', connected)
        done()
      }
      this.adapter.on('connected', connected)
      this.adapter.run()
    })
  })

  it('dispatches received messages to the robot', function () {
    this.robot.receive = sinon.spy()
    this.adapter = this.robot.adapter
    this.message = sinon.spy()

    this.adapter.receive(this.message)

    expect(this.robot.receive).to.have.been.calledWith(this.message)
  })
})
