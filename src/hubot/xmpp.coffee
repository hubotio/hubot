Robot = require 'robot'
Xmpp  = require 'node-xmpp'

class XmppBot extends Robot
  run: ->
    options =
      username: process.env.HUBOT_XMPP_USERNAME
      password: process.env.HUBOT_XMPP_PASSWORD
      rooms:    process.env.HUBOT_XMPP_ROOMS.split(',')
      keepaliveInterval: 30000 # ms interval to send whitespace to xmpp server

    console.log options

    @client = new Xmpp.Client
      jid: options.username
      password: options.password

    @client.on 'online', @.online
    @client.on 'stanza', @.read

    @options = options

  online: =>
    console.log 'Hubot XMPP client online'

    @client.send new Xmpp.Element('presence', type: 'available' )
      .c('show').t('chat')

    # join each room
    # http://xmpp.org/extensions/xep-0045.html for XMPP chat standard
    for room in @options.rooms
      @client.send(new Xmpp.Element('presence', to: "#{room}/#{@name}" )
        .c('x', xmlns: 'http://jabber.org/protocol/muc' )
        .c('history', seconds: 1 )) # prevent the server from confusing us with old messages
                                    # and it seems that servers don't reliably support maxchars
                                    # or zero values

    # send raw whitespace for keepalive
    setInterval =>
      @client.send ' '
    , @options.keepaliveInterval

  read: (stanza) =>
    if stanza.attrs.type is 'error'
      console.error '[xmpp error]' + stanza
      return

    # ignore non-messages
    return if !stanza.is 'message' || stanza.attrs.type not in ['groupchat', 'direct', 'chat']

    # ignore our own messages
    return if @options.username in stanza.attrs.from

    # ignore empty bodies (i.e., topic changes -- maybe watch these someday)
    body = stanza.getChild 'body'
    return unless body

    message = body.getText()

    [room, from] = stanza.attrs.from.split '/'
    user = new Robot.User from, {
      room: room
      type: stanza.attrs.type
    }

    @receive new Robot.TextMessage user, message

  send: (user, strings...) ->
    strings.forEach (str) =>
      console.log "Sending to #{user.room}: #{str}"

      to = if user.type in ['direct', 'chat'] then user.room + '/' + user.id else user.room

      message = new Xmpp.Element('message',
                  from: @options.username
                  to: to
                  type: user.type
                ).
                c('body').t(str)

      @client.send message

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"


exports.XmppBot = XmppBot
