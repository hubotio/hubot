Robot  = require '../src/robot'
assert = require 'assert'

# Sentient training facility for Hubot
# http://en.wikipedia.org/wiki/Danger_Room
class Danger extends Robot
  constructor: (path) ->
    super path
    @sent = []

  send: (user, strings...) ->
    strings.forEach (str) =>
      @sent.push str
    @cb?()

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"

  # modified to accept a string and pass the Robot.Message to super()
  receive: (text) ->
    user = new Robot.User 1, 'danger'
    super new Robot.Message(user, text)

danger = new Danger "#{__dirname}/scripts"
server = require('http').createServer (req, res) ->
  res.writeHead 200
  res.end "fetched"

server.listen 9001, ->
  assert.equal 4, danger.listeners.length
  assert.equal 0, danger.sent.length

  danger.receive 'test'
  assert.equal 1, danger.sent.length
  assert.equal 'OK', danger.sent[0]

  danger.receive 'reply'
  assert.equal 2, danger.sent.length
  assert.equal 'danger: OK', danger.sent[1]

  danger.receive 'random'
  assert.equal 3, danger.sent.length
  assert.ok danger.sent[2].match(/^(1|2)$/)

  # set a callback for when the next message is replied to
  danger.cb = ->
    assert.equal 4, danger.sent.length
    assert.equal 'fetched', danger.sent[3]
    server.close()
    
  danger.receive 'fetch'

