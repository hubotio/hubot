Tests  = require './tests'
assert = require 'assert'
helper = Tests.helper()
require './scripts/test'

server = require('http').createServer (req, res) ->
  res.writeHead 200
  res.end "fetched"

server.listen 9001, ->
  assert.equal 7, helper.listeners.length
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

  # Test that when we message a room, the 'recipient' is the robot user and the room attribute is set properly
  helper.messageRoom "chat@example.com", "Hello room"
  assert.equal 4, helper.sent.length
  assert.equal "chat@example.com", helper.recipients[3].room
  assert.equal "Hello room", helper.sent[3]

  helper.messageRoom "chat2@example.com", "Hello to another room"
  assert.equal 5, helper.sent.length
  assert.equal "chat2@example.com", helper.recipients[4].room
  assert.equal "Hello to another room", helper.sent[4]

  helper.adapter.receive 'foobar'
  assert.equal 6, helper.sent.length
  assert.equal 'catch-all', helper.sent[5]

  # Testing replies
  # ============================
  # Using just the name
  helper.adapter.receive "#{helper.name} rsvp"
  assert.equal 7, helper.sent.length
  assert.equal "responding", helper.sent[6]

  # Using name with @ form
  helper.adapter.receive "@#{helper.name} rsvp"
  assert.equal 8, helper.sent.length
  assert.equal "responding", helper.sent[7]

  # Using just the alias
  helper.adapter.receive "#{helper.alias} rsvp"
  assert.equal 9, helper.sent.length
  assert.equal "responding", helper.sent[8]

  # Using alias with @ form
  helper.adapter.receive "@#{helper.alias} rsvp"
  assert.equal 10, helper.sent.length
  assert.equal "responding", helper.sent[9]


  # set a callback for when the next message is replied to
  helper.cb = (msg) ->
    assert.equal 7, helper.sent.length
    assert.equal 'fetched', msg
    helper.close()
    server.close()

  helper.adapter.receive 'http'

  helper.stop()

