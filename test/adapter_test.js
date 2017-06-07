'use strict'

/* global describe, beforeEach, it */

const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))

const expect = chai.expect

const Adapter = require('../src/adapter')

describe('Adapter', function () {
  beforeEach(function () {
    this.robot = {receive: sinon.spy()}
  })

  // this one is hard, as it requires files
  it('can load adapter by name')

  describe('Public API', function () {
    beforeEach(function () {
      this.adapter = new Adapter(this.robot)
    })

    it('assigns robot', function () {
      expect(this.adapter.robot).to.equal(this.robot)
    })

    describe('send', function () {
      it('is a function', function () {
        expect(this.adapter.send).to.be.a('function')
      })

      it('does nothing', function () {
        this.adapter.send({}, 'nothing')
      })
    })

    describe('reply', function () {
      it('is a function', function () {
        expect(this.adapter.reply).to.be.a('function')
      })

      it('does nothing', function () {
        this.adapter.reply({}, 'nothing')
      })
    })

    describe('topic', function () {
      it('is a function', function () {
        expect(this.adapter.topic).to.be.a('function')
      })

      it('does nothing', function () {
        this.adapter.topic({}, 'nothing')
      })
    })

    describe('play', function () {
      it('is a function', function () {
        expect(this.adapter.play).to.be.a('function')
      })

      it('does nothing', function () {
        this.adapter.play({}, 'nothing')
      })
    })

    describe('run', function () {
      it('is a function', function () {
        expect(this.adapter.run).to.be.a('function')
      })

      it('does nothing', function () {
        this.adapter.run()
      })
    })

    describe('close', function () {
      it('is a function', function () {
        expect(this.adapter.close).to.be.a('function')
      })

      it('does nothing', function () {
        this.adapter.close()
      })
    })
  })

  it('dispatches received messages to the robot', function () {
    this.robot.receive = sinon.spy()
    this.adapter = new Adapter(this.robot)
    this.message = sinon.spy()

    this.adapter.receive(this.message)

    expect(this.robot.receive).to.have.been.calledWith(this.message)
  })
})
