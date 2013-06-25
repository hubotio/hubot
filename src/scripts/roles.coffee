# Description:
#   Assign roles to people you're chatting with
#
# Commands:
#   hubot <user> is a badass guitarist - assign a role to a user
#   hubot <user> is not a badass guitarist - remove a role from a user
#   hubot who is <user> - see what roles a user has
#
# Examples:
#   hubot holman is an ego surfer
#   hubot holman is not an ego surfer

module.exports = (robot) ->

  if process.env.HUBOT_AUTH_ADMIN?
    robot.logger.warning 'The HUBOT_AUTH_ADMIN environment variable is set not going to load roles.coffee, you should delete it'
    return

  getAmbiguousUserText = (users) ->
    "Be more specific, I know #{users.length} people named like that: #{(user.name for user in users).join(", ")}"

  robot.respond /who is @?([\w .\-]+)\?*$/i, (msg) ->
    joiner = ', '
    name = msg.match[1].trim()

    if name is "you"
      msg.send "Who ain't I?"
    else if name is robot.name
      msg.send "The best."
    else
      users = robot.brain.usersForFuzzyName(name)
      if users.length is 1
        user = users[0]
        user.roles = user.roles or [ ]
        if user.roles.length > 0
          if user.roles.join('').search(',') > -1
            joiner = '; '
          msg.send "#{name} is #{user.roles.join(joiner)}."
        else
          msg.send "#{name} is nothing to me."
      else if users.length > 1
        msg.send getAmbiguousUserText users
      else
        msg.send "#{name}? Never heard of 'em"

  robot.respond /@?([\w .\-_]+) is (["'\w: \-_]+)[.!]*$/i, (msg) ->
    name    = msg.match[1].trim()
    newRole = msg.match[2].trim()

    unless name in ['', 'who', 'what', 'where', 'when', 'why']
      unless newRole.match(/^not\s+/i)
        users = robot.brain.usersForFuzzyName(name)
        if users.length is 1
          user = users[0]
          user.roles = user.roles or [ ]

          if newRole in user.roles
            msg.send "I know"
          else
            user.roles.push(newRole)
            if name.toLowerCase() is robot.name.toLowerCase()
              msg.send "Ok, I am #{newRole}."
            else
              msg.send "Ok, #{name} is #{newRole}."
        else if users.length > 1
          msg.send getAmbiguousUserText users
        else
          msg.send "I don't know anything about #{name}."

  robot.respond /@?([\w .\-_]+) is not (["'\w: \-_]+)[.!]*$/i, (msg) ->
    name    = msg.match[1].trim()
    newRole = msg.match[2].trim()

    unless name in ['', 'who', 'what', 'where', 'when', 'why']
      users = robot.brain.usersForFuzzyName(name)
      if users.length is 1
        user = users[0]
        user.roles = user.roles or [ ]

        if newRole not in user.roles
          msg.send "I know."
        else
          user.roles = (role for role in user.roles when role isnt newRole)
          msg.send "Ok, #{name} is no longer #{newRole}."
      else if users.length > 1
        msg.send getAmbiguousUserText users
      else
        msg.send "I don't know anything about #{name}."

