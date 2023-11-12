'use strict'

/* eslint-disable no-unused-expressions */

const { describe, it } = require('node:test')
const assert = require('assert/strict')
const root = __dirname.replace(/test$/, '')
const { TextMessage, User } = require('../index.js')
const path = require('node:path')
const { spawn } = require('child_process')

describe('Running bin/hubot.js', () => {
  it('should load adapter from HUBOT_FILE environment variable', async () => {
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

  it('should output a help message when run with --help', (t, done) => {
    const hubot = process.platform === 'win32' ? spawn('node', ['./bin/hubot.js', '--help']) : spawn('./bin/hubot', ['--help'])
    const expected = `Usage: hubot [options]
  -a, --adapter HUBOT_ADAPTER
  -f, --file HUBOT_FILE
  -c, --create HUBOT_CREATE
  -d, --disable-httpd HUBOT_HTTPD
  -h, --help
  -l, --alias HUBOT_ALIAS
  -n, --name HUBOT_NAME
  -r, --require PATH
  -t, --config-check
  -v, --version
`
    let actual = ''
    hubot.stdout.on('data', (data) => {
      actual += data.toString()
    })
    hubot.stderr.on('data', (data) => {
      actual += data.toString()
    })
    hubot.on('close', (code) => {
      assert.deepEqual(actual, expected)
      done()
    })
  })
})
