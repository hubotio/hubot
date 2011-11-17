Robot = require "../robot"
Irc   = require "irc"

class IrcBot extends Robot.Adapter
  send: (user, strings...) ->
    for str in strings
      if user.room
        console.log "#{user.room} #{str}"
        @bot.say(user.room, str)
      else
        console.log "#{user.name} #{str}"
        @bot.say(user.name, str)

  reply: (user, strings...) ->
    for str in strings
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
      nick:     process.env.HUBOT_IRC_NICK or @robot.name
      port:     process.env.HUBOT_IRC_PORT
      rooms:    process.env.HUBOT_IRC_ROOMS.split(",")
      server:   process.env.HUBOT_IRC_SERVER
      password: process.env.HUBOT_IRC_PASSWORD
      nickpass: process.env.HUBOT_IRC_NICKSERV_PASSWORD
      fakessl:  !!process.env.HUBOT_IRC_SERVER_FAKE_SSL
      unflood:  !!process.env.HUBOT_IRC_UNFLOOD
      debug:    !!process.env.HUBOT_IRC_DEBUG
      usessl:   !!process.env.HUBOT_IRC_USESSL

    client_options =
      password: options.password,
      debug: options.debug,
      port: options.port,
      stripColors: true,
      secure: options.usessl,
      selfSigned: options.fakessl,
      floodProtection: options.unflood

    unless options.nickpass
        client_options['channels'] = options.rooms

    bot = new Irc.Client options.server, options.nick, client_options

    next_id = 1
    user_id = {}

    if options.nickpass?
      bot.addListener 'notice', (from, to, text) ->
        if from is 'NickServ' and text.indexOf('registered') isnt -1
          bot.say 'NickServ', "identify #{options.nickpass}"
        else if options.nickpass and from is 'NickServ' and text.indexOf('Password accepted') isnt -1
          for room in options.rooms
            @join room

    bot.addListener 'message', (from, to, message) ->
      console.log "From #{from} to #{to}: #{message}"
      
      user = self.userForName from
      unless user?
        id = (new Date().getTime() / 1000).toString().replace('.','')
        user = self.userForId id
        user.name = from

      if to.match(/^[&#]/)
        user.room = to
        console.log "#{to} <#{from}> #{message}"
      else
        user.room = null
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

    bot.addListener 'invite', (channel, from) ->
      console.log('%s invite you to join %s', from, channel)
      bot.join channel

    @bot = bot

module.exports = IrcBot

