Readline = require 'readline-history'

Robot         = require '../robot'
Adapter       = require '../adapter'
{TextMessage} = require '../message'


historySize = if process.env.HUBOT_SHELL_HISTSIZE?
                parseInt(process.env.HUBOT_SHELL_HISTSIZE)
              else
                1024

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
      maxLength: historySize, # number of entries
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
              user_id = parseInt(process.env.HUBOT_SHELL_USER_ID or '1')
              user_name = process.env.HUBOT_SHELL_USER_NAME or 'Shell'
              user = @robot.brain.userForId user_id, name: user_name, room: 'Shell'
              @receive new TextMessage user, buffer, 'messageId'
          @repl.prompt(true)

        @emit 'connected'

        @repl.setPrompt "#{@robot.name}> "
        @repl.prompt(true)


exports.use = (robot) ->
  new Shell robot
