util = require 'util'

module.exports = (robot) ->

  robot.respond /FAKE EVENT (.*)/i, (msg) ->

  robot.respond
    description: 'Trigger a fake event'
    example: 'hubot fake event [data]'
    match: /fake event (.*)/i
    handler: (msg, user, room, matches) ->
      room.send "fake event '#{matches[1]}' triggered"
      robot.emit matches[1], user: user

  robot.on 'debug', (event) ->
    robot.send event.user, util.input event
