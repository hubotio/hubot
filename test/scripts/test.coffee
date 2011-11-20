# Tests hubot listeners
module.exports = (robot) ->
  assert = require 'assert'

  robot.hear /test/i, (msg) ->
    msg.send "OK"

  robot.hear /reply/i, (msg) ->
    msg.reply "OK"

  robot.hear /random/i, (msg) ->
    msg.send msg.random([1,2]).toString()

  robot.hear /http/i, (msg) ->
    msg.http('http://127.0.0.1').port(9001)
      .get() (err, res, body) ->
        msg.send body

