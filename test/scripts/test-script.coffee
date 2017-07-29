# Description:
# Says pong when you say ping
#
# Commands:
# hubot <ping> - replies @user pong
#
sinon = require 'sinon'
module.exports = sinon.spy (robot) ->
  robot.respond /ping/i, (res) ->
    res.reply 'pong'
