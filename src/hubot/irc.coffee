Robot = require "robot"
Irc   = require "irc"

class IrcBot extends Robot
  send: (user, strings...) ->
    strings.forEach (str) =>
      console.log "#{user.name}: #{str}"
      @bot.say(user.room, str)

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"

  run: ->
    self = @
    options =
      server:   process.env.HUBOT_IRC_SERVER
      rooms:   process.env.HUBOT_IRC_ROOMS.split(",")
      nick: process.env.HUBOT_IRC_NICK

    console.log options

    bot = new Irc.Client options.server, options.nick, {
      debug: true,
      channels: options.rooms,
    }

    next_id = 1
    user_id = {}

    bot.addListener 'message', (from, toRoom, message) ->
      console.log "From #{from} to #{toRoom}: #{message}"

      if message.match new RegExp "^#{options.nick}", "i"
        unless user_id[from]
          user_id[from] = next_id
          next_id = next_id + 1

        user = new Robot.User user_id[from], from || "user", {
          room: toRoom,
        }

      self.receive new Robot.Message(user, message)

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

exports.IrcBot = IrcBot

# vim: ts=2 sw=2 et :
