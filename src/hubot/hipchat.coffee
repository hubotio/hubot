Robot        = require "robot"
HTTPS        = require "https"
EventEmitter = require("events").EventEmitter
Wobot        = require("wobot").Bot

class HipChat extends Robot
  send: (user, strings...) ->
    console.log "Sending"
    strings.forEach (str) =>
      @bot.message user.room || user.jid, str

  reply: (user, strings...) ->
    console.log "Replying"
    strings.forEach (str) =>
      @send user, "@#{user.name} #{str}"

  run: ->
    self = @
    @options =
      token:    process.env.HUBOT_HIPCHAT_TOKEN
      jid:      process.env.HUBOT_HIPCHAT_JID
      name:     process.env.HUBOT_HIPCHAT_NAME || "Hubot, I"
      password: process.env.HUBOT_HIPCHAT_PASSWORD

    console.log "Options:", @options
    bot = new Wobot(jid: @options.jid, name: @options.name, password: @options.password)
    console.log "Bot:", bot

    bot.onConnect =>
      console.log "Connected to HipChat"
      @get "/v1/rooms/list", (err, response)->
        if response
          response.rooms.forEach (room)->
            bot.join room.xmpp_jid
        else
          console.log "Can't list rooms: #{err}"
      @get "/v1/users/list", (err, response)->
        if response
          response.users.forEach (user)->
            self.userForId user.user_id, user
        else
          console.log "Can't list rooms: #{err}"
    bot.onError (message, stanza)->
      console.log "Received error from HipChat:", message, stanza
    bot.onMessage /^\s*@hubot\s/i, (channel, from, message)->
      console.log from
      author = self.userForName(from)
      author.room = channel
      self.receive new Robot.Message(author, message.replace(/^\s*@hubot\s+/, "Hubot: "))
    bot.onPrivateMessage (from, message)=>
      author = self.userForId(from.match(/_(\d+)@/)[1])
      author.jid = from
      self.receive new Robot.Message(author, "Hubot: #{message}")
    bot.connect()

    @bot = bot


  # Convenience HTTP Methods for posting on behalf of the token"d user
  get: (path, callback) ->
    @request "GET", path, null, callback

  post: (path, body, callback) ->
    @request "POST", path, body, callback

  request: (method, path, body, callback) ->
    console.log method, path, body
    headers = { "Host": "api.hipchat.com" }

    options =
      "agent"  : false
      "host"   : "api.hipchat.com"
      "port"   : 443
      "path"   : path
      "method" : method
      "headers": headers

    if method is "POST"
      body.auth_token = @options.token
      body = JSON.stringify(body)
      headers["Content-Type"] = "application/json"

      body = new Buffer(body)
      options.headers["Content-Length"] = body.length
    else
      options.path += "?auth_token=#{@options.token}"

    request = HTTPS.request options, (response) ->
      data = ""
      response.on "data", (chunk) ->
        data += chunk
      response.on "end", ->
        if response.statusCode >= 400
          console.log "hipchat error: #{response.statusCode}"

        try
          callback null, JSON.parse(data)
        catch err
          callback null, data || { }
      response.on "error", (err) ->
        callback err, { }

    if method is "POST"
      request.end(body, 'binary')
    else
      request.end()

    request.on "error", (err) ->
      console.log err
      console.log err.stack
      callback err

exports.HipChat = HipChat
