# Generates help commands for Hubot.
#
# These commands are grabbed from comment blocks at the top of each file.
#
# help - Displays all of the help commands that Hubot knows about.
Fs   = require 'fs'
Path = require 'path'

# Array of all the commands found in Hubot script sources
commands = [ ]

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

# Traverse the robot load paths looking for files
#
# paths - Array of loadpaths from the robot object
#
# Returns nothing
loadHelpFiles = (paths) ->
  paths.forEach (path) ->
    Path.exists path, (exists) ->
     if exists
        console.log "Loading help files at #{path}"
        Fs.readdirSync(path).forEach (file) =>
          Fs.readFile "#{path}/#{file}", "utf-8", (error, body) ->
            throw error if error
            parseCommands(body)

module.exports = (robot) ->
  robot.hear /help$/i, (msg) ->
    if commands.length == 0
      loadHelpFiles(robot.loadPaths)
      setTimeout =>
        msg.send commands.sort().join("\n")
      , 1500
    else
      msg.send commands.sort().join("\n")
