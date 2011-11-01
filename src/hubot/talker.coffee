Robot        = require "../robot"
HTTPS        = require "https"
EventEmitter = require("events").EventEmitter
net          = require('net')
tls          = require('tls')

class Talker extends Robot
  send: (user, strings...) ->
    strings.forEach (str) =>
      @bot.write user.room, {"type": "message", "content": str}

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "@#{user.name} #{str}"

  run: ->
    self = @
    token = process.env.HUBOT_TALKER_TOKEN
    rooms = process.env.HUBOT_TALKER_ROOMS.split(',')

    bot = new TalkerClient()
    console.log bot

    ping = (room)->
      setInterval ->
        bot.write room, {type: "ping"}
      , 25000

    bot.on "Ready", (room)->
      message = {"room": room, "token": token, "type": "connect"}
      bot.write room, message
      ping room

    bot.on "Users", (message)->
      for user in message.users
        self.userForId(user.id, user)

    bot.on "TextMessage", (room, message)->
      unless self.name == message.user.name
        # Replace "@mention" with "mention: ", case-insensitively
        regexp = new RegExp "^@#{self.name}", 'i'
        content = message.content.replace(regexp, "#{self.name}:")

        self.receive new Robot.TextMessage self.userForMessage(room, message), content

    bot.on "EnterMessage", (room, message) ->
      unless self.name == message.user.name
        self.receive new Robot.EnterMessage self.userForMessage(room, message)

    bot.on "LeaveMessage", (room, message) ->
      unless self.name == message.user.name
        self.receive new Robot.LeaveMessage self.userForMessage(room, message)

    for room in rooms
      bot.sockets[room] = bot.createSocket(room)

    @bot = bot

  userForMessage: (room, message)->
    author = @userForId(message.user.id, message.user)
    author.room = room
    author

module.exports = Talker

class TalkerClient extends EventEmitter
  constructor: ->
    @domain        = 'talkerapp.com'
    @encoding      = 'utf8'
    @port          = 8500
    @sockets       = {}

  createSocket: (room) ->
    self = @

    socket = tls.connect @port, @domain, ->
      console.log("Connected to room #{room}.")
      self.emit "Ready", room

    #callback
    socket.on 'data', (data) ->
      for line in data.split '\n'
        message = if line is '' then null else JSON.parse(line)

        if message
          console.log "From room #{room}: #{line}"
          if message.type == "users"
            self.emit "Users", message
          if message.type == "message"
            self.emit "TextMessage", room, message
          if message.type == "join"
            self.emit "EnterMessage", room, message
          if message.type == "leave"
            self.emit "LeaveMessage", room, message
          if message.type == "error"
            self.disconnect room, message.message

    socket.addListener "eof", ->
      console.log "eof"
    socket.addListener "timeout", ->
      console.log "timeout"
    socket.addListener "end", ->
      console.log "end"

    socket.setEncoding @encoding

    socket

  write: (room, arguments) ->
    self = @
    @sockets[room]

    if @sockets[room].readyState != 'open'
      return @disconnect 'cannot send with readyState: ' + @sockets[room].readyState

    message = JSON.stringify(arguments)
    console.log "To room #{room}: #{message}"

    @sockets[room].write message, @encoding

  disconnect: (room, why) ->
    if @sockets[room] != 'closed'
      @sockets[room]
      console.log 'disconnected (reason: ' + why + ')'
