Tests  = require('./tests')
assert = require 'assert'
helper = Tests.helper()
mu     = "http://mustachify.me/?src="

require('../scripts/google-images') helper

# start up a danger room for google images
danger = Tests.danger helper, (req, res, url) ->
  res.writeHead 200
  res.end JSON.stringify(
    {responseData: {results: [
      {unescapedUrl: "(#{url.query.q})"}
    ]}}
  )

# callbacks for when hubot sends messages
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

# run the async tests
danger.start tests, ->
  helper.receive 'stache me foo'
  helper.receive 'stache foo'
  helper.receive 'mustache me foo'
  helper.receive 'mustache foo'
  helper.receive 'img foo'
  helper.receive 'image me foo'
  helper.receive 'image foo'
  helper.receive 'animate me foo'
