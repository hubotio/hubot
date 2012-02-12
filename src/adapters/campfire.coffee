Robot        = require '../robot'
Adapter      = require '../adapter'

HTTPS        = require 'https'
EventEmitter = require('events').EventEmitter

class Campfire extends Adapter

  send: (user, strings...) ->
    if strings.length > 0
      @bot.Room(user.room).speak strings.shift(), (err, data) =>
        @robot.logger.error "Campfire error: #{err}" if err?
        @send user, strings...

  reply: (user, strings...) ->
    @send user, strings.map((str) -> "#{user.name}: #{str}")...

  topic: (user, strings...) ->
    @bot.Room(user.room).topic strings.join(" / "), (err, data) =>
      @robot.logger.error "Campfire error: #{err}" if err?

  run: ->
    self = @

    options =
      token:   process.env.HUBOT_CAMPFIRE_TOKEN
      rooms:   process.env.HUBOT_CAMPFIRE_ROOMS
      account: process.env.HUBOT_CAMPFIRE_ACCOUNT

    bot = new CampfireStreaming(options, @robot)

    withAuthor = (callback) -> (id, created, room, user, body) ->
      bot.User user, (err, userData) ->
        if userData.user
          author = self.userForId(userData.user.id, userData.user)
          self.robot.brain.data.users[userData.user.id].name = userData.user.name
          self.robot.brain.data.users[userData.user.id].email_address = userData.user.email_address
          author.room = room
          callback id, created, room, user, body, author

    bot.on "TextMessage", withAuthor (id, created, room, user, body, author) ->
      unless bot.info.id == author.id
        self.receive new Robot.TextMessage(author, body)

    bot.on "EnterMessage", withAuthor (id, created, room, user, body, author) ->
      unless bot.info.id == author.id
        self.receive new Robot.EnterMessage(author)

    bot.on "LeaveMessage", withAuthor (id, created, room, user, body, author) ->
      unless bot.info.id == author.id
        self.receive new Robot.LeaveMessage(author)

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
      @robot.logger.error "Not enough parameters provided. I Need a token, rooms and account"
      process.exit(1)

    @token         = options.token
    @rooms         = options.rooms.split(",")
    @account       = options.account
    @domain        = @account + ".campfirenow.com"
    @authorization = "Basic " + new Buffer("#{@token}:x").toString("base64")

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
      self.post "/room/#{id}", "", callback

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
            # errors are not json formatted
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
                  self.emit data.type, data.id, data.created_at, data.room_id, data.user_id, data.body
                catch err
                  logger.error "Campfire error: #{err}"

        response.on "end", ->
          logger.error "Streaming connection closed for room #{id}. :("
          setTimeout (->
            self.emit "reconnect", id
          ), 5000

        response.on "error", (err) ->
          logger.error "Campfire response error: #{err}"

      request.on "error", (err) ->
        logger.error "Campfire request error: #{err}"

      request.end()

  # Convenience HTTP Methods for posting on behalf of the token"d user
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
      "Host"          : @domain
      "Content-Type"  : "application/json"

    options =
      "agent"  : false
      "host"   : @domain
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
              throw new Error "Invalid access token provided, campfire refused the authentication"
            else
              logger.error "Campfire error: #{response.statusCode}"

        try
          callback null, JSON.parse(data)
        catch err
          callback null, data or { }

      response.on "error", (err) ->
        logger.error "Campfire response error: #{err}"
        callback err, { }

    if method is "POST" || method is "PUT"
      request.end(body, 'binary')
    else
      request.end()

    request.on "error", (err) ->
      logger.error "Campfire request error: #{err}"
