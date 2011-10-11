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

    user = @userForId('1', {name: "Shell"})

    process.stdin.resume()
    process.stdin.on 'data', (txt) =>
      txt.toString().split("\n").forEach (line) =>
        return if line.length == 0
        @receive new Robot.Message user, line

    setTimeout =>
      user   = @userForId('1', {name: "Shell"})
      atmos  = @userForId('2', {name: "atmos"})
      holman = @userForId('3', {name: "Zach Holman"})
    , 3000

exports.Shell = Shell
