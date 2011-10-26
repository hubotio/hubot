Robot        = require "robot"
Xmpp         = require "node-xmpp"

class HipChat extends Robot
  send: (user, strings...) ->
    strings.forEach (str) =>
      @bot.send(new Xmpp.Element('message', { to: @options.room_jid + '/' + @options.room_nick, type: 'groupchat' }).
        c('body').t(str)
      )

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{str}"

  trim: (string) ->
    string.replace(/^\s*|\s*$/g, '')

  run: ->
    self = @
    options =
      nick: process.env.HUBOT_HC_NICK
      jid:  process.env.HUBOT_HC_JID
      password: process.env.HUBOT_HC_PASSWORD
      room_jid: process.env.HUBOT_HC_ROOM_JID
      room_nick: process.env.HUBOT_HC_ROOM_NICK

    console.log options
    @options = options
    # Once connected, set available presence and join room
    bot = new Xmpp.Client
      jid: options.jid + '/bot'
      password: options.password

    bot.on 'online', ->
      console.log "Skynet is ready!"

      # set bot as online
      bot.send(new Xmpp.Element('presence', { type: 'available' })
        .c('show').t('chat')
      )

      # join room (and request no chat history)
      bot.send(new Xmpp.Element('presence', { to: options.room_jid + '/' + options.nick }).
        c('x', { xmlns: 'http://jabber.org/protocol/muc' })
      )

      # send keepalive data or server will disconnect us after 150s of inactivity
      setInterval ->
        bot.send ' '
      , 30000

    bot.on 'stanza', (stanza) =>
      if stanza.attrs.type == 'error'
        console.log "[error] #{stanza}"
        return

      # ignore everything that isn't a room message
      if (!stanza.is('message') || !stanza.attrs.type == 'groupchat')
        return

      body = stanza.getChild('body')
      # message without body is probably a topic change
      if !body
        return

      message = body.getText()
      query = @trim(message).replace(/^@[a-z]* /, "")
      console.log query
      user = new Robot.User stanza.attrs.from
      @receive new Robot.Message(user, query)

    @bot = bot

exports.HipChat = HipChat
