HTTPS          = require 'https'
{EventEmitter} = require 'events'

Robot                                                = require '../robot'
Adapter                                              = require '../adapter'
{TextMessage,EnterMessage,LeaveMessage,TopicMessage} = require '../message'

class Campfire extends Adapter
  send: (envelope, strings...) ->
    if strings.length > 0
      string = strings.shift()
      if typeof(string) == 'function'
        string()
        @send envelope, strings...
      else
        @bot.Room(envelope.room).speak string, (err, data) =>
          @robot.logger.error "Campfire send error: #{err}" if err?
          @send envelope, strings...

  emote: (envelope, strings...) ->
    @send envelope, strings.map((str) -> "*#{str}*")...

  reply: (envelope, strings...) ->
    @send envelope, strings.map((str) -> "#{envelope.user.name}: #{str}")...

  topic: (envelope, strings...) ->
    @bot.Room(envelope.room).topic strings.join(" / "), (err, data) =>
      @robot.logger.error "Campfire topic error: #{err}" if err?

  play: (envelope, strings...) ->
    @bot.Room(envelope.room).sound strings.shift(), (err, data) =>
      @robot.logger.error "Campfire sound error: #{err}" if err?
      @play envelope, strings...

  locked: (envelope, strings...) ->
    if envelope.message.private
      @send envelope, strings...
    else
      @bot.Room(envelope.room).lock (args...) =>
        strings.push =>
          # campfire won't send messages from just before a room unlock. 3000
          # is the 3-second poll.
          setTimeout (=> @bot.Room(envelope.room).unlock()), 3000
        @send envelope, strings...

  run: ->
    self = @

    options =
      token:   process.env.HUBOT_CAMPFIRE_TOKEN
      rooms:   process.env.HUBOT_CAMPFIRE_ROOMS
      account: process.env.HUBOT_CAMPFIRE_ACCOUNT

    bot = new CampfireStreaming(options, @robot)

    withAuthor = (callback) ->
      (id, created, room, user, body) ->
        bot.User user, (err, userData) ->
          if userData.user
            author = self.robot.brain.userForId(userData.user.id, userData.user)
            userId = userData.user.id
            self.robot.brain.data
              .users[userId].name = userData.user.name
            self.robot.brain.data
              .users[userId].email_address = userData.user.email_address
            author.room = room
            callback id, created, room, user, body, author

    bot.on "TextMessage",
      withAuthor (id, created, room, user, body, author) ->
        unless bot.info.id is author.id
          message = new TextMessage author, body, id
          message.private = bot.private[room]
          self.receive message

    bot.on "EnterMessage",
      withAuthor (id, created, room, user, body, author) ->
        unless bot.info.id is author.id
          self.receive new EnterMessage author, null, id

    bot.on "LeaveMessage",
      withAuthor (id, created, room, user, body, author) ->
        unless bot.info.id is author.id
          self.receive new LeaveMessage author, null, id

    bot.on "TopicChangeMessage",
      withAuthor (id, created, room, user, body, author) ->
        unless bot.info.id is author.id
          self.receive new TopicMessage author, body, id

    bot.on "LockMessage",
      withAuthor (id, created, room, user, body, author) ->
        bot.private[room] = true

    bot.on "UnlockMessage",
      withAuthor (id, created, room, user, body, author) ->
        bot.private[room] = false

    bot.Me (err, data) ->
      bot.info = data.user
      bot.name = bot.info.name

      for roomId in bot.rooms
        do (roomId) ->
          bot.Room(roomId).join (err, callback) ->
            bot.Room(roomId).listen()

    bot.on "reconnect", (roomId) ->
      bot.Room(roomId).join (err, callback) ->
        bot.Room(roomId).listen()

    @bot = bot

    self.emit "connected"

exports.use = (robot) ->
  new Campfire robot

class CampfireStreaming extends EventEmitter
  constructor: (options, @robot) ->
    unless options.token? and options.rooms? and options.account?
      @robot.logger.error \
        "Not enough parameters provided. I need a token, rooms and account"
      process.exit(1)

    @token         = options.token
    @rooms         = options.rooms.split(",")
    @account       = options.account
    @host          = @account + ".campfirenow.com"
    @authorization = "Basic " + new Buffer("#{@token}:x").toString("base64")
    @private       = {}

  Rooms: (callback) ->
    @get "/rooms", callback

  User: (id, callback) ->
    @get "/users/#{id}", callback

  Me: (callback) ->
    @get "/users/me", callback

  Room: (id) ->
    self = @
    logger = @robot.logger

    show: (callback) ->
      self.get "/room/#{id}", callback

    join: (callback) ->
      self.post "/room/#{id}/join", "", callback

    leave: (callback) ->
      self.post "/room/#{id}/leave", "", callback

    lock: (callback) ->
      self.post "/room/#{id}/lock", "", callback

    unlock: (callback) ->
      self.post "/room/#{id}/unlock", "", callback

    # say things to this channel on behalf of the token user
    paste: (text, callback) ->
      @message text, "PasteMessage", callback

    topic: (text, callback) ->
      body = {room: {topic: text}}
      self.put "/room/#{id}", body, callback

    sound: (text, callback) ->
      @message text, "SoundMessage", callback

    speak: (text, callback) ->
      body = { message: { "body":text } }
      self.post "/room/#{id}/speak", body, callback

    message: (text, type, callback) ->
      body = { message: { "body":text, "type":type } }
      self.post "/room/#{id}/speak", body, callback

    # listen for activity in channels
    listen: ->
      headers =
        "Host"          : "streaming.campfirenow.com"
        "Authorization" : self.authorization

      options =
        "agent"  : false
        "host"   : "streaming.campfirenow.com"
        "port"   : 443
        "path"   : "/room/#{id}/live.json"
        "method" : "GET"
        "headers": headers

      request = HTTPS.request options, (response) ->
        response.setEncoding("utf8")

        buf = ''

        response.on "data", (chunk) ->
          if chunk is ' '
            # campfire api sends a ' ' heartbeat every 3s

          else if chunk.match(/^\s*Access Denied/)
            logger.error "Campfire error on room #{id}: #{chunk}"

          else
            # api uses newline terminated json payloads
            # buffer across tcp packets and parse out lines
            buf += chunk

            while (offset = buf.indexOf("\r")) > -1
              part = buf.substr(0, offset)
              buf = buf.substr(offset + 1)

              if part
                try
                  data = JSON.parse part
                  self.emit(
                    data.type,
                    data.id,
                    data.created_at,
                    data.room_id,
                    data.user_id,
                    data.body
                  )
                catch error
                  logger.error "Campfire data error: #{error}\n#{error.stack}"

        response.on "end", ->
          logger.error "Streaming connection closed for room #{id}. :("
          setTimeout ->
            self.emit "reconnect", id
          , 5000

        response.on "error", (err) ->
          logger.error "Campfire listen response error: #{err}"

      request.on "error", (err) ->
        logger.error "Campfire listen request error: #{err}"

      request.end()

  get: (path, callback) ->
    @request "GET", path, null, callback

  post: (path, body, callback) ->
    @request "POST", path, body, callback

  put: (path, body, callback) ->
    @request "PUT", path, body, callback

  request: (method, path, body, callback) ->
    logger = @robot.logger

    headers =
      "Authorization" : @authorization
      "Host"          : @host
      "Content-Type"  : "application/json"

    options =
      "agent"  : false
      "host"   : @host
      "port"   : 443
      "path"   : path
      "method" : method
      "headers": headers

    if method is "POST" || method is "PUT"
      if typeof(body) isnt "string"
        body = JSON.stringify body

      body = new Buffer(body)
      options.headers["Content-Length"] = body.length

    request = HTTPS.request options, (response) ->
      data = ""

      response.on "data", (chunk) ->
        data += chunk

      response.on "end", ->
        if response.statusCode >= 400
          switch response.statusCode
            when 401
              throw new Error "Invalid access token provided"
            else
              logger.error "Campfire HTTPS status code: #{response.statusCode}"
              logger.error "Campfire HTTPS response data: #{data}"

        if callback
          try
            callback null, JSON.parse(data)
          catch error
            callback null, data or { }

      response.on "error", (err) ->
        logger.error "Campfire HTTPS response error: #{err}"
        callback err, { }

    if method is "POST" || method is "PUT"
      request.end(body, 'binary')
    else
      request.end()

    request.on "error", (err) ->
      logger.error "Campfire request error: #{err}"
