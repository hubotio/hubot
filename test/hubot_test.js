'use strict'

/* eslint-disable no-unused-expressions */

const { describe, it } = require('node:test')
const assert = require('assert/strict')
const root = __dirname.replace(/test$/, '')
const { TextMessage, User } = require('../index.js')
const path = require('node:path')

describe('Running bin/hubot.js', () => {
  it('should load adapter from HUBOT_FILE environment variable', async function () {
    process.env.HUBOT_HTTPD = 'false'
    process.env.HUBOT_FILE = path.resolve(root, 'test', 'fixtures', 'MockAdapter.mjs')
    const hubot = require('../bin/hubot.js')
    await hubot.loadFile(path.resolve(root, 'test', 'fixtures'), 'TestScript.mjs')
    while (!hubot.adapter) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    hubot.adapter.on('reply', (envelope, ...strings) => {
      assert.equal(strings[0], 'test response from .mjs script')
      delete process.env.HUBOT_FILE
      delete process.env.HUBOT_HTTPD
      hubot.shutdown()
    })
    try {
      await hubot.receive(new TextMessage(new User('mocha', { room: '#mocha' }), '@Hubot test'))
      assert.deepEqual(hubot.hasLoadedTestMjsScript, true)
      assert.equal(hubot.name, 'Hubot')
    } finally {
      hubot.shutdown()
    }
  })
})
