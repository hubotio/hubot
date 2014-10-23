Readline = require 'readline-history'

Robot         = require '../robot'
Adapter       = require '../adapter'
{TextMessage} = require '../message'

class Shell extends Adapter
  send: (envelope, strings...) ->
    unless process.platform is 'win32'
      console.log "\x1b[01;32m#{str}\x1b[0m" for str in strings
    else
      console.log "#{str}" for str in strings
    @repl.prompt()

  emote: (envelope, strings...) ->
    @send envelope, "* #{str}" for str in strings

  reply: (envelope, strings...) ->
    strings = strings.map (s) -> "#{envelope.user.name}: #{s}"
    @send envelope, strings...

  run: ->
    stdin = process.openStdin()
    stdout = process.stdout

    @repl = null
    Readline.createInterface
      path: ".hubot_history",
      input: stdin,
      output: stdout,
      maxDiskLength: 1024 * 1024,
      maxLength: 1024 * 1024,
      next: (rl) =>
        @repl = rl
        @repl.on 'close', =>
          stdin.destroy()
          @robot.shutdown()
          process.exit 0

        @repl.on 'line', (buffer) =>

          switch buffer.toLowerCase()
            when "exit"
              @repl.close()
            when "history"
              stdout.write "#{line}\n" for line in @repl.history
            else
              user = @robot.brain.userForId '1', name: 'Shell', room: 'Shell'
              @receive new TextMessage user, buffer, 'messageId'
          @repl.prompt()

        @emit 'connected'

        @repl.setPrompt "#{@robot.name}> "
        @repl.prompt()

exports.use = (robot) ->
  new Shell robot
