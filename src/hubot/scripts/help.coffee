# Generates help commands for Hubot.
#
# These commands are grabbed from comment blocks at the top of each file.
#
# help - Displays all of the help commands that Hubot knows about.

module.exports = (robot) ->
  robot.respond /help$/i, (msg) ->
    msg.send robot.helpCommands().join("\n")

