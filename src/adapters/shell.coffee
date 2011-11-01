Robot = require '../robot'

class Shell extends Robot.Adapter
  send: (user, strings...) ->
    for str in strings
      console.log str

  reply: (user, strings...) ->
    for str in strings
      @send user, "#{user.name}: #{str}"

  run: ->
    console.log "Shell Adapter Running..."

    user = @robot.userForId('1', {name: "Shell"})

    process.stdin.resume()
    process.stdin.on 'data', (txt) =>
      txt.toString().split("\n").forEach (line) =>
        return if line.length is 0
        @receive new Robot.TextMessage user, line

    setTimeout =>
      user   = @robot.userForId('1', {name: "Shell"})
      atmos  = @robot.userForId('2', {name: "atmos"})
      holman = @robot.userForId('3', {name: "Zach Holman"})
    , 3000

  receive: (message) ->
    @robot.receive(message)

module.exports = Shell

