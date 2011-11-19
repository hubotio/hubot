Robot           = require('hubot').robot()

ImapConnection  = require('imap').ImapConnection
EventEmitter    = require("events").EventEmitter
util            = require('util')

CRLF = "\r\n"

class Email extends Robot.Adapter
  run: ->
    self = @

    @username = process.env.HUBOT_EMAIL_USERNAME
    @password = process.env.HUBOT_EMAIL_PASSWORD

    imap = new ImapBot
      username: @username
      password: @password
      host:     process.env.HUBOT_IMAP_HOST
      port:     process.env.HUBOT_IMAP_PORT
      secure:   process.env.HUBOT_IMAP_SECURE && true
      mailbox:  process.env.HUBOT_MAILBOX || 'Inbox'

    imap.listen (email) ->
      console.log email

    imap.connect()

exports.use = (robot) ->
  new Email robot

class ImapBot extends EventEmitter
  constructor: (options) ->
    @username = options.username
    @password = options.password
    @host     = options.host
    @port     = options.port
    @secure   = options.secure
    @mailbox  = options.mailbox

    @imap = new ImapConnection
      username: @username
      password: @password
      host:     @host
      port:     (Number) @port
      secure:   @secure

  connect: (callback) ->
    @imap.connect (err) =>
      throw err if err?

      @open()

  open: ->
    @imap.openBox @mailbox, (err) =>
      throw err if err?
      @imap.on 'error', (err) -> throw err
      @imap.on 'mail', @recieve

  recieve: =>
    @imap.search [ 'UNSEEN' ], (_, ids) =>
      @fetch ids...

  fetch: (ids...) ->
    @fetchHeaders ids, (msg) =>
      @fetchBody msg, (email) ->
        console.log(email)

  fetchHeaders: (ids, callback) ->
    fetch = @imap.fetch ids, markSeen: true

    fetch.on 'message', (msg) ->
      msg.on 'end', -> callback(msg)

  fetchBody: (headerMsg, callback) ->
    fetch = @imap.fetch headerMsg.id,
      request:
        headers:  false
        body:     true

    fetch.on 'message', (bodyMsg) ->
      message = new Message headerMsg, bodyMsg

      bodyMsg.on 'data', (chunk) ->
        message.recieveData(chunk)

      bodyMsg.on 'end', ->
        message.endData ->
          console.log(util.inspect(message))

  listen: (callback) ->
    @imap.on 'Email', (mail...) ->
      console.log(mail)

class Message
  constructor: (headerMsg, bodyMsg) ->
    @headerMsg  = headerMsg
    @bodyMsg    = bodyMsg

    @rawBody  = ''
    @buffer   = ''
    @state    = 'INIT'

  recieveData: (buff) -> @buffer += buff.toString('ascii')

  endData: (callback) ->
    @rawBody = @buffer.toString()
    @parse(callback)

  parse: (callback) ->
    while @buffer
      switch @state
        when 'INIT'    then @readBoundry()
        when 'HEADERS' then @readHeaders()
        when 'BODY'    then @readBody()
        when 'FIN'     then @readFinish(callback)

  readBoundry: ->
    throw "Boundary Missing" if @buffer.indexOf(CRLF) == -1

    lines     = @buffer.split(CRLF)
    @boundary = lines.shift()
    @buffer   = lines.join(CRLF)

    @state = 'HEADERS'

  readHeaders: ->
    throw "Header(s) Missing" if @buffer.indexOf(CRLF + CRLF) == -1

    # throw away the body headers for now
    [_, parts...] = @buffer.split(CRLF + CRLF)
    @buffer = parts.join(CRLF + CRLF)

    @state = 'BODY'

  readBody: ->
    throw "Plain Body Missing" if @buffer.indexOf(@boundary) == -1

    @body = @buffer.split(@boundary, 1)[0]

    @state = 'FIN'

  readFinish: (callback) ->
    @buffer = ''
    callback()
