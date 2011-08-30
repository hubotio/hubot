# Utility commands surrounding Hubot uptime.
module.exports = (robot) ->
  robot.hear /PING$/i, (msg) ->
    msg.send "PONG"

  robot.hear /ECHO (.*)$/i, (msg) ->
    msg.send msg.match[1]

  robot.hear /TIME$/i, (msg) ->
    msg.send "Server time is: #{new Date()}"
