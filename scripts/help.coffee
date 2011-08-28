# Generates help commands for Hubot.
#
# These commands are grabbed from comment blocks at the top of each file.
#
# help - Displays all of the help commands that Hubot knows about.
Fs = require 'fs'

# Extract commands from the top comment blocks in a file.
#
# body - The body of text to search through (usually file contents).
#
# Returns an Array of commands and their help text.
commands = (body) ->
  cmds = []
  for i, line of body.split("\n")
    break    if line[0] != '#'
    continue if !line.match('-')
    cmds.push   line[2..line.length]
  cmds if cmds.length > 0

module.exports = (robot) ->
  robot.hear /help$/i, (msg) ->
    Fs.readdirSync('scripts').forEach (file) =>
      Fs.readFile "scripts/#{file}", "utf-8", (error, body) ->
        throw error if error
        cmd = commands(body)
        msg.send cmd if cmd
