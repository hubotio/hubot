module.exports = (robot) ->

  robot.respond
    description: 'Reply with pong'
    example: 'hubot ping'
    match: /PING$/i
    handler: (msg, user, room, matches) ->
      room.send 'PONG'

  robot.respond
    description: 'Reply back with <text>'
    example: 'hubot echo <text>'
    match: /ECHO (.*)$/i
    handler: (msg, user, room, matches) ->
      room.send matches[1]

  robot.respond
    description: 'Reply with the current time'
    example: 'hubot time'
    match: /TIME$/i
    handler: (msg, user, room, matches) ->
      room.send "Server time is: #{new Date}"

  robot.respond
    description: 'End the hubot process'
    example: 'hubot die'
    match: /DIE$/i
    handler: (msg, user, room, matches) ->
      room.send "Goodbye, cruel world."
      process.exit 0
