Tests  = require './tests'
assert = require 'assert'
helper = Tests.helper()

server = require('http').createServer (req, res) ->
  res.writeHead 200
  res.end "fetched"

server.listen 9001, ->
  assert.equal 4, helper.listeners.length
  assert.equal 0, helper.sent.length

  helper.adapter.receive 'test'
  assert.equal 1, helper.sent.length
  assert.equal 'OK', helper.sent[0]

  helper.adapter.receive 'reply'
  assert.equal 2, helper.sent.length
  assert.equal 'helper: OK', helper.sent[1]

  helper.adapter.receive 'random'
  assert.equal 3, helper.sent.length
  assert.ok helper.sent[2].match(/^(1|2)$/)

  # set a callback for when the next message is replied to
  helper.cb = (msg) ->
    assert.equal 4, helper.sent.length
    assert.equal 'fetched', msg
    helper.close()
    server.close()

  helper.adapter.receive 'http'

  helper.stop()

