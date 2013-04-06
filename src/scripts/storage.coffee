util = require "util"

module.exports = (robot) ->

  robot.respond
    description: 'Display all the contents that are persisted to the brain'
    example: 'hubot show storage'
    match: /show storage$/i
    handler: (msg, user, room, matches) ->
      output = util.inspect(robot.brain.data, false, 4)
      room.send output

  robot.respond
    description: 'Display all the user that hubot knows about'
    example: 'hubot show users'
    match: /show users$/i
    handler: (msg, user, room, matches) ->
      response = ""
      for own key, user of robot.brain.data.users
        response += "#{user.id} #{user.name}"
        response += " <#{user.email_address}>" if user.email_address
        response += "\n"
      room.send response
