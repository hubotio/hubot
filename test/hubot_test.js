'use strict'

/* global describe, it, before, after */
/* eslint-disable no-unused-expressions */

const path = require('path')
const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const root = __dirname.replace(/test$/, '')
const { TextMessage, User } = require('../index.js')

describe('hubot', () => {
  let hubot
  before(() => {
    process.env.HUBOT_ADAPTER = path.join(__dirname, './fixtures/MockAdapter.mjs')
    hubot = require('../bin/hubot.js')
  })
  after(() => {
    hubot.shutdown()
    delete process.env.HUBOT_ADAPTER
  })
  it('should export robot instance', done => {
    hubot.loadFile(path.resolve(root, 'test/fixtures'), 'TestScript.mjs').then(() => {
      hubot.adapter.on('reply', (envelope, ...strings) => {
        expect(strings[0]).to.equal('test response from .mjs script')
        done()
      })
      hubot.receive(new TextMessage(new User('mocha', { room: '#mocha' }), 'Hubot test'))
      expect(hubot.hasLoadedTestMjsScript).to.be.true
      expect(hubot.name).to.equal('Hubot')
    }).catch(done)
  })
})
