Robot = require "../robot"
Irc   = require "irc"

class IrcBot extends Robot
  send: (user, strings...) ->
    for str in strings
      do (str) ->
        if user.room
          console.log "#{user.room} #{str}"
          @bot.say(user.room, str)
        else
          console.log "#{user.name} #{str}"
          @bot.say(user.name, str)

  reply: (user, strings...) ->
    for str in strings
      do (str) ->
        @send user, "#{user.name}: #{str}"

  join: (channel) ->
    self = @
    @bot.join channel, () ->
      console.log('joined %s', channel)

  part: (channel) ->
    @bot.part channel, () ->
      console.log('left %s', channel)

  run: ->
    self = @

    options =
      nick:     process.env.HUBOT_IRC_NICK or @name
      port:     process.env.HUBOT_IRC_PORT
      rooms:    process.env.HUBOT_IRC_ROOMS.split(",")
      server:   process.env.HUBOT_IRC_SERVER
      password: process.env.HUBOT_IRC_PASSWORD
      nickpass: process.env.HUBOT_IRC_NICKSERV_PASSWORD

    console.log options

    client_options = {
          password: options.password,
          debug: true,
          port: options.port,
          stripColors: true,
        }

    unless options.nickpass
        client_options['channels'] = options.rooms

    bot = new Irc.Client options.server, options.nick, client_options

    next_id = 1
    user_id = {}

    if options.nickpass?
      bot.addListener 'notice', (from, to, text) ->
        if from is 'NickServ' and text.indexOf('registered') isnt -1
          bot.say 'NickServ', "identify #{options.nickpass}"
        else if options.nickpass and from is 'NickServ' and text.indexOf('now identified') isnt -1
          for room in options.rooms
            do (room) ->
              @join room

    bot.addListener 'message', (from, to, message) ->
      console.log "From #{from} to #{to}: #{message}"

      if message.match new RegExp "^#{options.nick}", "i"
        unless user_id[from]
          user_id[from] = next_id
          next_id = next_id + 1

      user = new Robot.User user_id[from]
      user.name = from
      if to.match(/^[&#]/)
        user.room = to
        console.log "#{to} <#{from}> #{message}"
      else
        console.log "msg <#{from}> #{message}"

      self.receive new Robot.TextMessage(user, message)

    bot.addListener 'error', (message) ->
        console.error('ERROR: %s: %s', message.command, message.args.join(' '))

    bot.addListener 'pm', (nick, message) ->
        console.log('Got private message from %s: %s', nick, message)

    bot.addListener 'join', (channel, who) ->
        console.log('%s has joined %s', who, channel)

    bot.addListener 'part', (channel, who, reason) ->
        console.log('%s has left %s: %s', who, channel, reason)

    bot.addListener 'kick', (channel, who, _by, reason) ->
        console.log('%s was kicked from %s by %s: %s', who, channel, _by, reason)

    @bot = bot

module.exports = IrcBot

