Robot = require 'robot'

class Shell extends Robot
  send: (user, strings...) ->
    strings.forEach (str) ->
      console.log str

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"

  run: ->
    console.log "Hubot: the Shell."

    user = new Robot.User 1, 'shell'
    process.stdin.resume()
    process.stdin.on 'data', (txt) =>
      txt.toString().split("\n").forEach (line) =>
        return if line.length == 0
        @receive new Robot.Message user, line

exports.Shell = Shell
