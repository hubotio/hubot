assert = require 'assert'

Helper  = require './helper'
helper  = Helper.helper()

{TextMessage} = require '../src/message'

require('../src/scripts/google-images') helper

danger = Helper.danger helper, (req, res, url) ->
  res.writeHead 200
  res.end JSON.stringify(
    responseData:
      results: [
        unescapedUrl: "(#{url.query.q})"
      ]
  )

mu    = "http://mustachify.me/?src="
tests = [
  (msg) -> assert.equal "#{mu}(foo)#.png", msg
  (msg) -> assert.equal "#{mu}(foo)#.png", msg
  (msg) -> assert.equal "#{mu}(foo)#.png", msg
  (msg) -> assert.equal "#{mu}(foo)#.png", msg
  (msg) -> assert.equal "(foo)#.png", msg
  (msg) -> assert.equal "(foo)#.png", msg
  (msg) -> assert.equal "(foo)#.png", msg
  (msg) -> assert.equal "(animated foo)#.png", msg
]

messages = [
  'helper: stache me foo',
  'helper: stache foo',
  'helper: mustache me foo',
  'helper: mustache foo',
  'helper: img foo',
  'helper: image me foo',
  'helper: image foo',
  'helper: animate me foo'
]
user = {}
danger.start tests, ->
  for message in messages
    helper.receive new TextMessage user, message

  helper.stop()

