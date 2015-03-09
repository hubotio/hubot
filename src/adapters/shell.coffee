Cline = require('cline')
fs    = require('fs')
readline = require('readline')
stream = require('stream')
util = require('util')

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

  emote: (envelope, strings...) ->
    @send envelope, "* #{str}" for str in strings

  reply: (envelope, strings...) ->
    strings = strings.map (s) -> "#{envelope.user.name}: #{s}"
    @send envelope, strings...

  loadHistory: (callback) ->
    fs.exists '.hubot_history', (exists) ->
      if exists
        instream = fs.createReadStream('.hubot_history')
        outstream = new stream
        outstream.readable = true
        outstream.writable = true

        items = []
        rl = readline.createInterface(input: instream, output: outstream, terminal: false)
        rl.on 'line', (line) ->
          if line.length > 0 
            items.push(line)
        rl.on 'close', () ->
          callback(items)
      else
        callback([])

  buildCli: () ->
    @cli = Cline()

    @cli.command "*", (input) =>
      console.log "got #{input}"
      user_id = parseInt(process.env.HUBOT_SHELL_USER_ID or '1')
      user_name = process.env.HUBOT_SHELL_USER_NAME or 'Shell'
      user = @robot.brain.userForId user_id, name: user_name, room: 'Shell'
      @receive new TextMessage user, input, 'messageId'

    # workaround https://github.com/kucoe/cline/issues/5
    @cli.commands['*'] = @cli.commands['\\*']

    @cli.command 'history', () =>
      console.log @cli.history()

    #@cli.on 'command', (input, cmd) ->
    #  console.log "on command #{input}"
    @cli.on 'history', (item) =>
      if item.length > 0 and item isnt 'exit'
        console.log "adding #{item} to the history"

        fs.appendFile '.hubot_history', "#{item}\n", (err) =>
          @robot.emit 'error', err if err

    @cli.on 'close', () =>
      console.log "on close!"
      @robot.shutdown()
      process.exit 0

  run: ->
    @buildCli()

    @loadHistory (history) =>
      @cli.history(history)
      @cli.interact("#{@robot.name}> ")
      @emit 'connected'


exports.use = (robot) ->
  new Shell robot
