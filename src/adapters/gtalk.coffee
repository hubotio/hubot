Robot = require '../robot'
Xmpp = require 'node-xmpp'

class Gtalkbot extends Robot
  run: ->

    # Client Options
    options = 
      jid: process.env.HUBOT_GTALK_USERNAME
      password: process.env.HUBOT_GTALK_PASSWORD
      host: 'talk.google.com'
      port: 5222
      keepaliveInterval: 30000 # ms interval to send whitespace to xmpp server

    # Connect to gtalk servers
    @client = new Xmpp.Client options

    # Events
    @client.on 'online', @.online
    @client.on 'stanza', @.read
    @client.on 'error', @.error
    
    # Log options
    console.log options

    # Share the optionss
    @options = options

  online: =>
    @client.send new Xmpp.Element('presence')

    # send raw whitespace for keepalive
    setInterval =>
      @client.send ' '
    , @options.keepaliveInterval

    # He is alive!
    console.log @name + ' is online, talk.google.com!'

  read: (stanza) =>
    if stanza.attrs.type is 'error'
      console.error '[xmpp error] - ' + stanza
      return

    # Make sure we have a message
    return if !stanza.is 'message' or stanza.attrs.type not in ['groupchat', 'direct', 'chat']
    
    # Strip the from attribute to get who this is from
    [from, room] = stanza.attrs.from.split '/'
    # ignore empty bodies (i.e., topic changes -- maybe watch these someday)
    body = stanza.getChild 'body'
    return unless body
    
    message = body.getText()

    # Pad the message with robot name just incase it was not provided.
    message = if !message.match(new RegExp("^"+@name+":?","i")) then @name+" "+message else message

    # Send the message to the robot
    @receive new Robot.TextMessage from, message
  
  send: (user, strings...) ->
    for str in strings
      message = new Xmpp.Element('message',
          from: @options.username
          to: user
          type: 'chat' 
        ).
        c('body').t(str)
      # Send it off
      @client.send message

  reply: (user, strings...) ->
    for str in strings
      @send user, "#{str}"

  error: (err) =>
    console.error err

module.exports = Gtalkbot