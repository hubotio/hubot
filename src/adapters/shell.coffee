Readline = require 'readline'

Robot    = require '../robot'
Adapter  = require '../adapter'

class Shell extends Adapter
  send: (user, strings...) ->
    unless process.platform is "win32"
      console.log "\x1b[01;32m#{str}\x1b[0m" for str in strings
    else
      console.log "#{str}" for str in strings
    @repl.prompt()

  reply: (user, strings...) ->
    @send user, strings...

  run: ->
    self = @
    stdin = process.openStdin()
    stdout = process.stdout

    process.on "uncaughtException", (err) =>
      @robot.logger.error "#{err}"

    @repl = Readline.createInterface stdin, stdout, null

    @repl.on "close", =>
      stdin.destroy()
      @robot.shutdown()
      process.exit 0

    @repl.on "line", (buffer) =>
      @repl.close() if buffer.toLowerCase() is "exit"
      @repl.prompt()
      user = @userForId '1', name: "Shell", room: "Shell"
      @receive new Robot.TextMessage user, buffer

    self.emit "connected"
    @repl.setPrompt "#{@robot.name}> "
    @repl.prompt()

exports.use = (robot) ->
  new Shell robot
