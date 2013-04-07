module.exports = (robot) ->

  getAmbiguousUserText = (users) ->
    "Be more specific, I know #{users.length} people named like that: #{(user.name for user in users).join(", ")}"

  robot.respond
    description: 'Assign a role to a user'
    example: 'hubot holman is an ego surfer'
    match: /@?([\w .\-_]+) is (["'\w: \-_]+)[.!]*$/i
    handler: (msg, user, room, matches) ->
      name    = matches[1].trim()
      newRole = matches[2].trim()

      unless name in ['', 'who', 'what', 'where', 'when', 'why']
        unless newRole.match(/^not\s+/i)
          users = robot.brain.usersForFuzzyName(name)
          if users.length is 1
            user = users[0]
            user.roles = user.roles or [ ]

            if newRole in user.roles
              room.send "I know"
            else
              user.roles.push(newRole)
              if name.toLowerCase() is robot.name.toLowerCase()
                room.send "Ok, I am #{newRole}."
              else
                room.send "Ok, #{name} is #{newRole}."
          else if users.length > 1
            room.send getAmbiguousUserText users
          else
            room.send "I don't know anything about #{name}."

  robot.respond
    description: 'Remove a role from a user'
    example: 'hubot holman is not an ego surfer'
    match: /@?([\w .\-_]+) is not (["'\w: \-_]+)[.!]*$/i
    handler: (msg, user, room, matches) ->
      name    = matches[1].trim()
      newRole = matches[2].trim()

      unless name in ['', 'who', 'what', 'where', 'when', 'why']
        users = robot.brain.usersForFuzzyName(name)
        if users.length is 1
          user = users[0]
          user.roles = user.roles or [ ]

          if newRole not in user.roles
            room.send "I know."
          else
            user.roles = (role for role in user.roles when role isnt newRole)
            room.send "Ok, #{name} is no longer #{newRole}."
        else if users.length > 1
          room.send getAmbiguousUserText users
        else
          room.send "I don't know anything about #{name}."

  robot.respond
    description: 'See what roles a user has'
    example: 'hubot who is holman'
    match: /who is @?([\w .\-]+)\?*$/i
    handler: (msg, user, room, matches) ->
      joiner = ', '
      name = matches[1].trim()

      if name is "you"
        room.send "Who ain't I?"
      else if name is robot.name
        room.send "The best."
      else
        users = robot.brain.usersForFuzzyName(name)
        if users.length is 1
          user = users[0]
          user.roles = user.roles or [ ]
          if user.roles.length > 0
            if user.roles.join('').search(',') > -1
              joiner = '; '
            room.send "#{name} is #{user.roles.join(joiner)}."
          else
            room.send "#{name} is nothing to me."
        else if users.length > 1
          room.send getAmbiguousUserText users
        else
          room.send "#{name}? Never heard of 'em"
