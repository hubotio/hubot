Robot = require '../src/robot'
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

  server

class Helper extends Robot
  constructor: (path) ->
    super path
    @sent = []
    @Response = Helper.Response

  send: (user, strings...) ->
    strings.forEach (str) =>
      @sent.push str
    @cb? strings...

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"

  # modified to accept a string and pass the Robot.Message to super()
  receive: (text) ->
    user = new Robot.User 1, 'helper'
    super new Robot.Message(user, text)

class Helper.Response extends Robot.Response
  http: (url) ->
    super(url).host('127.0.0.1').port(9001)

