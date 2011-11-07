Robot = require '../robot'
Xmpp = require 'node-xmpp'

class Gtalkbot extends Robot
  run: ->

    # Client Options
    options = 
      jid: process.env.HUBOT_GTALK_USERNAME
      password: process.env.HUBOT_GTALK_PASSWORD
      acceptDomains: (entry.trim() for entry in (process.env.HUBOT_GTALK_WHITELIST_DOMAINS ? '').split(',') when entry.trim() != '')
      acceptUsers: (entry.trim() for entry in (process.env.HUBOT_GTALK_WHITELIST_USERS ? '').split(',') when entry.trim() != '')
      host: 'talk.google.com'
      port: 5222
      keepaliveInterval: 15000 # ms interval to send query to gtalk server
    
    if not options.jid or not options.password
      throw Error('You need to set HUBOT_GTALK_USERNAME and HUBOT_GTALK_PASSWORD anv vars for gtalk to work')

    # Connect to gtalk servers
    @client = new Xmpp.Client 
      jid: options.jid
      password: options.password
      host: options.host
      port: options.port

    # Events
    @client.on 'online', @.online
    @client.on 'stanza', @.readStanza
    @client.on 'error', @.error

    # Share the optionss
    @options = options

  online: =>
    @client.send new Xmpp.Element('presence')

    # He is alive!
    console.log @name + ' is online, talk.google.com!'

    roster_query = new Xmpp.Element('iq',
        type: 'get'
        id: (new Date).getTime()
      )
      .c('query', 
        xmlns: 'jabber:iq:roster'
      )

    # Check for buddy requests every so often
    @client.send roster_query
    setInterval =>
      @client.send roster_query
    , @options.keepaliveInterval

  readStanza: (stanza) =>
    # Useful for debugging
    # console.log stanza

    # Check for erros
    if stanza.attrs.type is 'error'
      console.error '[xmpp error] - ' + stanza
      return

    # Check for presence responses
    if stanza.is 'presence'
      @handlePresence stanza
      return

    # Check for message responses
    if stanza.is 'message' or stanza.attrs.type not in ['groupchat', 'direct', 'chat']
      @handleMessage stanza
      return

  handleMessage: (stanza) =>
    if @ignoreUser(stanza.attrs.from)
      console.log "Ignoring user message because of whitelist: #{stanza.attrs.from}"
      console.log "  Accepted Users: " + @options.acceptUsers.join(',')
      console.log "  Accepted Domains: " + @options.acceptDomains.join(',')
      return

    # Strip the from attribute to get who this is from
    [from, room] = stanza.attrs.from.split '/'
    # ignore empty bodies (i.e., topic changes -- maybe watch these someday)
    body = stanza.getChild 'body'
    return unless body

    message = body.getText()

    # Pad the message with robot name just incase it was not provided.
    message = if !message.match(new RegExp("^"+@name+":?","i")) then @name + " " + message else message

    # Send the message to the robot
    @receive new Robot.TextMessage from, message

  handlePresence: (stanza) =>
    # Check for buddy request
    return if stanza.attrs.type isnt 'subscribe'
    
    if @ignoreUser(stanza.attrs.from)
      console.log "Ignoring user subscribe because of whitelist: #{stanza.attrs.from}"
      console.log "  Accepted Users: " + @options.acceptUsers.join(',')
      console.log "  Accepted Domains: " + @options.acceptDomains.join(',')
      return

    # Accept
    @client.send new Xmpp.Element('presence',
      to:   stanza.attrs.from
      id:   stanza.attrs.id
      type: 'subscribed'
    )
    
  ignoreUser: (user) ->
    ignore = false
    
    if @options.acceptDomains.length > 0 or @options.acceptUsers.length > 0
      ignore = true
      [from, room] = user.split '/'
      if @options.acceptDomains.length > 0
        [username, domain] = from.split '@'
        ignore = false if domain in @options.acceptDomains
        
      if @options.acceptUsers.length > 0
        ignore = false if from in @options.acceptUsers
    
    return ignore
  
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
