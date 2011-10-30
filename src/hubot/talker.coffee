Robot        = require "../robot"
HTTPS        = require "https"
EventEmitter = require("events").EventEmitter
net          = require('net')
tls          = require('tls')

class Talker extends Robot
  send: (user, strings...) ->
    strings.forEach (str) =>
      @bot.write {"type": "message", "content": str}

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"

  run: ->
    self = @
    options =
      token:   process.env.HUBOT_TALKER_TOKEN
      rooms:   process.env.HUBOT_TALKER_ROOMS

    console.log options
    bot = new TalkerClient(options)
    console.log bot
    
    bot.connect ->
      options.rooms.split(',').forEach (room) ->
        console.log "Entering room: " + room
        bot.write {"room": room, "token": options.token, "type": "connect"}
        
      setInterval -> 
        bot.write {type: "ping"}
      , 25000

    bot.on "Users", (message)->
      for user in message.users
        self.userForId(user.id, user)

    bot.on "TextMessage", (message)->
      console.log message
      author = self.userForId(message.user.id, message.user)
      self.receive new Robot.TextMessage(author, message.content.replace(/^\s*@hubot\s+/, "Hubot: "))
    
    bot.on "EnterMessage", (message) ->
      console.log message
      author = self.userForId(message.user.id, message.user)
      self.receive new Robot.EnterMessage(author)
    
    bot.on "LeaveMessage", (message) ->
      console.log message
      author = self.userForId(message.user.id, message.user)
      self.receive new Robot.LeaveMessage(author)
    
    @bot = bot

module.exports = Talker

class TalkerClient extends EventEmitter
  constructor: (options) ->
    @token         = options.token
    @rooms         = options.rooms.split(",")
    @domain        = 'talkerapp.com'
    @encoding      = 'utf8'
    @port          = 8500

  connect: (callback) ->
    self = @    
    
    @socket = tls.connect @port, @domain, ->
      # callback called only after successful socket socket
      console.log "Connected to " + self.domain
      self.socket.setEncoding @encoding
      callback()
       
    #callback
    @socket.addListener 'data', (data) ->
      for line in data.split '\n'
        console.log line

        message = unless line is ''
          message = JSON.parse(line)
        else
          message = null

        if message
          if message.type == "connected"
            self.emit "Connected"
          if message.type == "users"
            self.emit "Users", message
          if message.type == "message"
            self.emit "TextMessage", message
          if message.type == "join"
            self.emit "EnterMessage", message
          if message.type == "leave"
            self.emit "LeaveMessage", message
          if message.type == "error"
            self.disconnect message.message

      
    @socket.addListener "eof", ->
      console.log "eof"
    @socket.addListener "timeout", ->
      console.log "timeout"
    @socket.addListener "end", ->
      console.log "end"
  
  write: (arguments) ->
    self = @
    
    if @socket.readyState != 'open'
      return self.disconnect 'cannot send with readyState: ' + @socket.readyState
  
    message = JSON.stringify(arguments)
    console.log message
    
    @socket.write message, @encoding
  
  disconnect: (why) ->
    if @socket.readyState != 'closed' 
      @socket.close
      console.log 'disconnected (reason: ' + why + ')'