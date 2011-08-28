# Tests hubot listeners
module.exports = (robot) ->
  assert = require 'assert'

  robot.hear /test/i, (res) ->
    res.send "OK"

  robot.hear /reply/i, (res) ->
    res.reply "OK"

  robot.hear /random/i, (res) ->
    res.send res.random([1,2]).toString()

  robot.hear /fetch/i, (res) ->
    res.fetch 'http://127.0.0.1:9001/', (httpRes) ->
      res.send httpRes.body
