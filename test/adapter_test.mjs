'use strict'

/* global describe, beforeEach, it */
import chai from 'chai'
import sinon from 'sinon'
import cs from 'sinon-chai'
import Adapter from '../src/adapter.mjs'
import File from 'fs/promises'
import { assert } from 'console'

chai.use(cs)
const expect = chai.expect

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
