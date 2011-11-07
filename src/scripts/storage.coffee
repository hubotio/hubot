# Inspect the data in redis easily
#
# show users - Display all users that hubot knows about
# show storage - Display the contents that are persisted in redis
#

Sys = require "sys"

module.exports = (robot) ->
  robot.respond /show storage$/i, (msg) ->
    output = Sys.inspect(robot.brain.data, false, 4)
    msg.send output

  robot.respond /show users$/i, (msg) ->
    response = ""

    for own key, user of robot.brain.data.users
      response += "#{user.id} #{user.name}"
      response += " <#{user.email_address}>" if user.email_address
      response += "\n"

    msg.send response
