# Assign roles to people you're chatting with
#
# hubot <user> is a extraordinary role
# hubot <user> is not a extraordinary role

# hubot holman is an ego surfer
# hubot holman is not an ego surfer
#

module.exports = (robot) ->
  robot.respond /who is ([\w .-]+)\?*$/i, (msg) ->
    name = msg.match[1]

    if user = robot.userForName name
      user.roles = user.roles or [ ]
      if user.roles.length > 0
        msg.send "#{name} is #{user.roles.join(", ")}."
      else
        msg.send "#{name} doesn't have any roles yet"
    else
      msg.send "#{name}? Never heard of 'em"

  robot.respond /(\w+) is (["'\w: ]+)[.!]*$/i, (msg) ->
    name    = msg.match[1]
    newRole = msg.match[2].trim()

    unless name in ['who', 'what', 'where', 'when', 'why']
      unless newRole.match(/^not\s+/i)
        if user = robot.userForName name
          user.roles = user.roles or [ ]

          if newRole in user.roles
            msg.send "I know"
          else
            user.roles.push(newRole)
            msg.send "Ok, #{name} is #{newRole}"

        else
          msg.send "#{name}? Never heard of 'em"

  robot.respond /(\w+) is not (["'\w: ]+)[.!]*$/i, (msg) ->
    name    = msg.match[1]
    newRole = msg.match[2].trim()

    unless name in ['who', 'what', 'where', 'when', 'why']
      if user = robot.userForName name
        user.roles = user.roles or [ ]

        if newRole not in user.roles
          msg.send "I know"
        else
          user.roles = (role for role in user.roles when role != newRole)
          msg.send "Ok, #{name} is no longer #{newRole}."

      else
        msg.send "#{name}? Never heard of 'em"
