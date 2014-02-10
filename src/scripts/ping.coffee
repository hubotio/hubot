# Description:
#   Utility commands surrounding Hubot uptime.
#
# Commands:
#   hubot ping - Reply with pong
#   hubot echo <text> - Reply back with <text>
#   hubot time - Reply with current time
#   hubot die - End hubot process

module.exports = (robot) ->
  robot.respond /PING$/i, (msg) ->
    msg.send "PONG"

  robot.respond /ECHO (.*)$/i, (msg) ->
    msg.send msg.match[1]

  robot.respond /TIME$/i, (msg) ->
    msg.send "Server time is: #{new Date()}"

  robot.respond /DIE$/i, (msg) ->
    if !process.env.HUBOT_AUTH_ADMIN? || robot.auth.isAdmin(msg.envelope.user)
      msg.send "Goodbye, cruel world."
      process.exit 0
    else
      msg.send "I'm sorry, #{msg.envelope.user.name}. I'm afraid I can't do that."

