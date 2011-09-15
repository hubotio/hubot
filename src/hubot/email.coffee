Robot           = require '../robot'
ImapConnection  = require('imap').ImapConnection
EventEmitter    = require("events").EventEmitter
util            = require('util')

class Email extends Robot
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

exports.Email = Email

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
      throw err if err

      @open()

  open: ->
    @imap.openBox @mailbox, (err) =>
      throw err if err
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
      bodyMsg.on 'data', (chunk) ->
        console.log("Got message chunk of size #{chunk.length}")
        console.log(chunk.toString('ascii'))

      bodyMsg.on 'end', ->
        console.log("Finished message: #{util.inspect(bodyMsg, false, 5)}")

  listen: (callback) ->
    @imap.on 'Email', (mail...) ->
      console.log(mail)
