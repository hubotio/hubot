fs       = require('fs')
readline = require('readline')
stream   = require('stream')
cline    = require('cline')
chalk    = require('chalk')

Robot         = require '../robot'
Adapter       = require '../adapter'
{TextMessage} = require '../message'

historySize = if process.env.HUBOT_SHELL_HISTSIZE?
                parseInt(process.env.HUBOT_SHELL_HISTSIZE)
              else
                1024

historyPath = ".hubot_history"

class Shell extends Adapter
  send: (envelope, strings...) ->
    console.log chalk.green.bold("#{str}") for str in strings

  emote: (envelope, strings...) ->
    @send envelope, "* #{str}" for str in strings

  reply: (envelope, strings...) ->
    strings = strings.map (s) -> "#{envelope.user.name}: #{s}"
    @send envelope, strings...

  run: ->
    @buildCli()

    @loadHistory (history) =>
      @cli.history(history)
      @cli.interact("#{@robot.name}> ")
      @emit 'connected'

  shutdown: () ->
    @robot.shutdown()
    process.exit 0

  buildCli: () ->
    @cli = cline()

    @cli.command '*', (input) =>
      userId = parseInt(process.env.HUBOT_SHELL_USER_ID or '1')
      userName = process.env.HUBOT_SHELL_USER_NAME or 'Shell'
      user = @robot.brain.userForId userId, name: userName, room: 'Shell'
      @receive new TextMessage user, input, 'messageId'

    @cli.command 'history', () =>
      console.log item for item in @cli.history()

    @cli.on 'history', (item) =>
      if item.length > 0 and item isnt 'exit' and item isnt 'history'
        fs.appendFile historyPath, "#{item}\n", (err) =>
          @robot.emit 'error', err if err

    @cli.on 'close', () =>
      history = @cli.history()
      if history.length > historySize
        startIndex = history.length - historySize
        history = history.reverse().splice(startIndex, historySize)

        outstream = fs.createWriteStream(historyPath)
        # >= node 0.10
        outstream.on 'finish', () =>
          @shutdown()

        for item in history
          outstream.write "#{item}\n"

        # < node 0.10
        outstream.end () =>
          @shutdown()
       else
         @shutdown()

  # Private: load history from .hubot_history.
  #
  # callback - A Function that is called with the loaded history items (or an empty array if there is no history)
  loadHistory: (callback) ->
    fs.exists historyPath, (exists) ->
      if exists
        instream = fs.createReadStream(historyPath)
        outstream = new stream
        outstream.readable = true
        outstream.writable = true

        items = []
        rl = readline.createInterface(input: instream, output: outstream, terminal: false)
        rl.on 'line', (line) ->
          line = line.trim()
          if line.length > 0 
            items.push(line)
        rl.on 'close', () ->
          callback(items)
      else
        callback([])

exports.use = (robot) ->
  new Shell robot
