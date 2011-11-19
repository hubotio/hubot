Robot = require('hubot').robot()

Xmpp = require 'node-xmpp'

class Gtalkbot extends Robot
  run: ->
    Xmpp.JID.prototype.from = -> @bare().toString()

    # Client Options
    @options = 
      username: process.env.HUBOT_GTALK_USERNAME
      password: process.env.HUBOT_GTALK_PASSWORD
      acceptDomains: (entry.trim() for entry in (process.env.HUBOT_GTALK_WHITELIST_DOMAINS ? '').split(',') when entry.trim() != '')
      acceptUsers: (entry.trim() for entry in (process.env.HUBOT_GTALK_WHITELIST_USERS ? '').split(',') when entry.trim() != '')
      host: 'talk.google.com'
      port: 5222
      keepaliveInterval: 15000 # ms interval to send query to gtalk server
    
    if not @options.username or not @options.password
      throw new Error('You need to set HUBOT_GTALK_USERNAME and HUBOT_GTALK_PASSWORD anv vars for gtalk to work')

    # Connect to gtalk servers
    @client = new Xmpp.Client
      jid: @options.username
      password: @options.password
      host: @options.host
      port: @options.port

    # Events
    @client.on 'online', @online
    @client.on 'stanza', @readStanza
    @client.on 'error', @error

  online: ->
    @client.send new Xmpp.Element('presence')
    
    # He is alive!
    console.log @name + ' is online, talk.google.com!'

    roster_query = new Xmpp.Element('iq',
        type: 'get'
        id: (new Date).getTime()
      )
      .c('query', xmlns: 'jabber:iq:roster')

    # Check for buddy requests every so often
    @client.send roster_query
    setInterval ->
      @client.send roster_query
    , @options.keepaliveInterval

  readStanza: (stanza) ->
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

  handleMessage: (stanza) ->
    jid = new Xmpp.JID(stanza.attrs.from)
    
    if @isMe(jid)
      return
    
    if @ignoreUser(jid)
      console.log "Ignoring user message because of whitelist: #{stanza.attrs.from}"
      console.log "  Accepted Users: " + @options.acceptUsers.join(',')
      console.log "  Accepted Domains: " + @options.acceptDomains.join(',')
      return

    # ignore empty bodies (i.e., topic changes -- maybe watch these someday)
    body = stanza.getChild 'body'
    return unless body

    message = body.getText()

    # Pad the message with robot name just incase it was not provided.
    message = if not message.match(new RegExp("^"+@name+":?","i")) then @name + " " + message else message

    # Send the message to the robot
    @receive new Robot.TextMessage @getUser(jid), message

  handlePresence: (stanza) ->
    jid = new Xmpp.JID(stanza.attrs.from)
    
    if @isMe(jid)
      return

    if @ignoreUser(jid)
      console.log "Ignoring user presence because of whitelist: #{stanza.attrs.from}"
      console.log "  Accepted Users: " + @options.acceptUsers.join(',')
      console.log "  Accepted Domains: " + @options.acceptDomains.join(',')
      return

    # xmpp doesn't add types for standard available mesages
    # note that upon joining a room, server will send available
    # presences for all members
    # http://xmpp.org/rfcs/rfc3921.html#rfc.section.2.2.1
    stanza.attrs.type ?= 'available'

    switch stanza.attrs.type
      when 'subscribe'
        console.log "#{jid.from()} subscribed to us"

        @client.send new Xmpp.Element('presence',
            from: @client.jid.toString()
            to:   stanza.attrs.from
            id:   stanza.attrs.id
            type: 'subscribed'
        )
        
      when 'probe'
        @client.send new Xmpp.Element('presence',
            from: @client.jid.toString()
            to:   stanza.attrs.from
            id:   stanza.attrs.id
        )
        
      when 'available'
        user = @getUser jid
        user.online = true
        
        @receive new Robot.EnterMessage(user)
        
      when 'unavailable'
        user = @getUser jid
        user.online = false
        
        @receive new Robot.LeaveMessage(user)
  
  getUser: (jid) ->
    user = @userForId jid.from(),
      name: jid.user
      user: jid.user
      domain: jid.domain
    
    # This can change from request to request
    user.resource = jid.resource
    return user
  
  isMe: (jid) ->
    return jid.from() == @options.username
    
  ignoreUser: (jid) ->
    if @options.acceptDomains.length < 1 and @options.acceptUsers.length < 1
      return false
    
    ignore = true
    
    if @options.acceptDomains.length > 0
      ignore = false if jid.domain in @options.acceptDomains
      
    if @options.acceptUsers.length > 0
      ignore = false if jid.from() in @options.acceptUsers
    
    return ignore
  
  send: (user, strings...) ->
    for str in strings
      message = new Xmpp.Element('message',
          from: @client.jid.toString()
          to: user.id
          type: 'chat'
        ).
        c('body').t(str)
      # Send it off
      @client.send message

  reply: (user, strings...) ->
    for str in strings
      @send user, "#{str}"

  error: (err) ->
    console.error err

exports.use = (robot) ->
  new GtalkBot robot

