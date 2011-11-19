Tests  = require './tests'
assert = require 'assert'
helper = Tests.helper()

require('../src/scripts/google-images') helper

# start up a danger room for google images
danger = Tests.danger helper, (req, res, url) ->
  res.writeHead 200
  res.end JSON.stringify(
    responseData:
      results: [
        unescapedUrl: "(#{url.query.q})"
      ]
  )

# callbacks for when hubot sends messages
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

# run the async tests
danger.start tests, ->
  helper.receive 'helper: stache me foo'
  helper.receive 'helper: stache foo'
  helper.receive 'helper: mustache me foo'
  helper.receive 'helper: mustache foo'
  helper.receive 'helper: img foo'
  helper.receive 'helper: image me foo'
  helper.receive 'helper: image foo'
  helper.receive 'helper: animate me foo'
  helper.stop()

