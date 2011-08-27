module.exports = (robot) ->
  robot.hear /PING$/i, (response) ->
    response.send "PONG"

  robot.hear /ECHO (.*)$/i, (response) ->
    response.send response.match[1]

  robot.hear /TIME$/i, (response) ->
    response.send "Server time is: #{new Date()}"
