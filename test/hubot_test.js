'use strict'

/* global describe, it */
/* eslint-disable no-unused-expressions */

const path = require('path')
const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const root = __dirname.replace(/test$/, '')
const { TextMessage, User } = require('../index.js')

describe('Running bin/hubot.js', () => {
  it('should load adapter from HUBOT_FILE environment variable', async function () {
    process.env.HUBOT_HTTPD = 'false'
    process.env.HUBOT_FILE = path.resolve(root, 'test', 'fixtures', 'MockAdapter.mjs')
    const hubot = require('../bin/hubot.js')
    await hubot.loadFile(path.resolve(root, 'test', 'fixtures'), 'TestScript.mjs')
    hubot.adapter.on('reply', (envelope, ...strings) => {
      expect(strings[0]).to.equal('test response from .mjs script')
      delete process.env.HUBOT_FILE
      delete process.env.HUBOT_HTTPD
      hubot.shutdown()
    })
    try {
      await hubot.receive(new TextMessage(new User('mocha', { room: '#mocha' }), '@Hubot test'))
      expect(hubot.hasLoadedTestMjsScript).to.be.true
      expect(hubot.name).to.equal('Hubot')
    } finally {
      hubot.shutdown()
    }
  })
})
