Robot = require '../src/robot'
Path  = require 'path'
Url   = require 'url'

# A programmer's best friend.
# http://timenerdworld.files.wordpress.com/2010/12/joint-venture-s1e3_1.jpg
#
# Instantiates a test-only Robot that sends messages to an optional callback
# and a @sent array.
exports.helper = ->
  new Helper "#{__dirname}/scripts"

# Training facility built for the Hubot scripts.  Starts up a web server to
# emulate backends (like google images) so we can test that the response
# parsing code functions.
exports.danger = (helper, cb) ->
  server = require('http').createServer (req, res) ->
    url = Url.parse req.url, true
    cb req, res, url

  server.start = (tests, cb) ->
    server.listen 9001, ->
      helper.cb = (messages...) ->
        tests.shift() messages...
        server.close() if tests.length == 0

      cb()

  server.on 'close', -> helper.close()
  server

class Helper extends Robot
  constructor: (scriptPath) ->
    super null, null, 'helper'
    @load scriptPath

    @Response = Helper.Response
    @sent = []

    @adapter = new Danger @

  stop: ->
    process.exit 0

class Danger extends Robot.Adapter
  send: (user, strings...) ->
    @robot.sent.push str for str in strings
    @cb? strings...

  reply: (user, strings...) ->
    @send user, "#{@robot.name}: #{str}" for str in strings

  receive: (text) ->
    user = new Robot.User 1, 'helper'
    super new Robot.TextMessage user, text

if not process.env.HUBOT_LIVE
  class Helper.Response extends Robot.Response
    # This changes ever HTTP request to hit the danger server above
    http: (url) ->
      super(url).host('127.0.0.1').port(9001)

