Robot = require "../robot"
Irc   = require "irc"

class IrcBot extends Robot
  send: (user, strings...) ->
    for str in strings
      console.log "#{user.name}: #{str}"
      @bot.say(user.room, str)

  reply: (user, strings...) ->
    for str in strings
      @send user, "#{user.name}: #{str}"

  userForName: (name) ->
    lowerName = name.toLowerCase()
    if lowerName of (@brain.data.users or { })
      return @brain.data.users[lowerName]
    null

  run: ->
    self = @
    options =
      nick:     process.env.HUBOT_IRC_NICK
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
        }

    unless options.nickpass
        client_options['channels'] = options.rooms

    bot = new Irc.Client options.server, options.nick, client_options

    if options.nickpass?
      bot.addListener 'notice', (from, to, text) ->
        if from is 'NickServ' and text.indexOf('registered') isnt -1
          bot.say 'NickServ', "identify #{options.nickpass}"
        else if options.nickpass and from is 'NickServ' and text.indexOf('now identified') isnt -1
          for room in options.rooms
            bot.join room, ->
              console.log('%s has joined %s', options.nick, room)

    bot.addListener 'message', (from, toRoom, message) ->
      console.log "From #{from} to #{toRoom}: #{message}"

      user = self.userForId(from.toLowerCase(), {name: from})
      user.room = toRoom

      self.receive new Robot.TextMessage(user, message)

    bot.addListener 'names', (channel, names) ->
      for name of names
        self.userForId(name.toLowerCase(), {name: name})

    bot.addListener 'join', (channel, name) ->
      self.userForId(name.toLowerCase(), {name: name})

    bot.addListener 'nick', (oldName, newName, channel) ->
      self.userForId(newName.toLowerCase(), {name: newName})

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

