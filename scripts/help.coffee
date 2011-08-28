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
parseCommands = (body) ->
  for i, line of body.split("\n")
    break    if line[0] != '#'
    continue if !line.match('-')
    commands.push line[2..line.length]

# Array of all the commands found in Hubot script sources
commands = [ ]

# Parse the files into the commands array at script load time
Fs.readdirSync('scripts').forEach (file) =>
  Fs.readFile "scripts/#{file}", "utf-8", (error, body) ->
    throw error if error
    parseCommands(body)

module.exports = (robot) ->
  robot.hear /help$/i, (msg) ->
    msg.send commands.sort().join("\n")
