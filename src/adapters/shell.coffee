Readline = require 'readline'

Robot    = require '../robot'
Adapter  = require '../adapter'

class Shell extends Adapter
  constructor: (robot) ->
    super robot
    @repl = null

  send: (user, strings...) ->
    console.log str for str in strings
    @repl.prompt()

  reply: (user, strings...) ->
    @send user, strings...

  run: ->
    stdin = process.openStdin()
    stdout = process.stdout

    process.on "uncaughtException", (err) =>
      @robot.logger.error "#{err}"

    if Readline.createInterface.length > 3
      @repl = Readline.createInterface stdin, null

      stdin.on "data", (buffer) =>
        @repl.write buffer
    else
      @repl = Readline.createInterface stdin, stdout, null

    @repl.on "attemptClose", =>
      @repl.close()

    @repl.on "close", =>
      process.stdout.write "\n"
      stdin.destroy()
      process.exit 0

    @repl.on "line", (buffer) =>
      user = @userForId '1', name: "Shell"
      @receive new Robot.TextMessage user, buffer
      @repl.prompt()

    @repl.setPrompt "#{@robot.name}> "
    @repl.prompt()

exports.use = (robot) ->
  new Shell robot

