# Description:
#   None
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot !! - Repeat the last command directed at hubot
#
# Author:
#   None
module.exports = (robot) ->
  assert = require 'assert'
  robot.hear /static/i, (msg) ->
    robot.http('http://127.0.0.1/test').port(process.env.PORT or 8080)
      .get() (err, res, body) ->
        msg.send body

  robot.hear /test/i, (msg) ->
    msg.send "OK"

  robot.hear /reply/i, (msg) ->
    msg.reply "OK"

  robot.respond /rsvp/i, (msg) ->
    msg.send "responding"

  robot.hear /random/i, (msg) ->
    msg.send msg.random([1,2]).toString()

  robot.hear /http/i, (msg) ->
    robot.http('http://127.0.0.1').port(9001)
      .get() (err, res, body) ->
        msg.send body

  robot.catchAll (msg) ->
    msg.send 'catch-all'
