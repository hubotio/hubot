module.exports = (robot) ->

  robot.respond
    description: 'Display all or filtered help for hubot commands'
    example: 'hubot help (filter)'
    match: /help\s*(.*)?$/i
    handler: (msg, user, room, matches) ->
      cmds = robot.helpCommands()
      if matches[1]
        cmds = cmds.filter (cmd) ->
          cmd.match new RegExp matches[1], 'i'

        if cmds.length == 0
          room.send "No available commands match #{matches[1]}"
        else
          emit = cmds.join "\n"
          unless robot.name.toLowerCase() is 'hubot'
            emit = emit.replace /hubot/ig, robot.name
          msg.send emit
