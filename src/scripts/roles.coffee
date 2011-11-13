# Assign roles to people you're chatting with
#
# <user> is a badass guitarist - assign a role to a user
# <user> is not a badass guitarist - remove a role from a user
# who is <user> - see what roles a user has

# hubot holman is an ego surfer
# hubot holman is not an ego surfer
#

module.exports = (robot) ->
  robot.respond /who is ([\w .-_]+)\?*$/i, (msg) ->
    name = msg.match[1]

    if name is "you"
      msg.send "Who ain't I?"
    else if name is robot.name
      msg.send "The best."
    else if user = robot.userForName name
      user.roles = user.roles or [ ]
      if user.roles.length > 0
        msg.send "#{name} is #{user.roles.join(", ")}."
      else
        msg.send "#{name} is nothing to me."
    else
      msg.send "#{name}? Never heard of 'em"

  robot.respond /([\w .-_]+) is (["'\w: -_]+)[.!]*$/i, (msg) ->
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
            if name.toLowerCase() is robot.name
              msg.send "Ok, I am #{newRole}."
            else
              msg.send "Ok, #{name} is #{newRole}."
        else
          msg.send "I don't know anything about #{name}."

  robot.respond /([\w .-_]+) is not (["'\w: -_]+)[.!]*$/i, (msg) ->
    name    = msg.match[1]
    newRole = msg.match[2].trim()

    unless name in ['who', 'what', 'where', 'when', 'why']
      if user = robot.userForName name
        user.roles = user.roles or [ ]

        if newRole not in user.roles
          msg.send "I know."
        else
          user.roles = (role for role in user.roles when role isnt newRole)
          msg.send "Ok, #{name} is no longer #{newRole}."

      else
        msg.send "I don't know anything about #{name}."
