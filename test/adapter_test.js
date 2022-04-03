'use strict'

/* global describe, beforeEach, it */

const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))

const expect = chai.expect

const Adapter = require('../src/adapter')

describe('Adapter', function () {
  beforeEach(function () {
    this.robot = { receive: sinon.spy() }
  })
  it('dispatches received messages to the robot', async function () {
    this.robot.receive = sinon.spy()
    this.adapter = new Adapter(this.robot)
    this.message = sinon.spy()
    await this.adapter.receive(this.message)
    expect(this.robot.receive).to.have.been.calledWith(this.message)
  })
})
