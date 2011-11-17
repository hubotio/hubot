Robot        = require "../robot"
HTTPS        = require "https"
Wobot        = require("wobot").Bot

class HipChat extends Robot.Adapter
  send: (user, strings...) ->
    for str in strings
      @bot.message user.reply_to, str

  reply: (user, strings...) ->
    for str in strings
      @send user, "@\"#{user.name}\" #{str}"

  run: ->
    self = @
    @options =
      token:    process.env.HUBOT_HIPCHAT_TOKEN
      jid:      process.env.HUBOT_HIPCHAT_JID
      name:     process.env.HUBOT_HIPCHAT_NAME or "#{self.name} Bot"
      password: process.env.HUBOT_HIPCHAT_PASSWORD
      rooms:    process.env.HUBOT_HIPCHAT_ROOMS or "@All"

    console.log "Options:", @options
    bot = new Wobot(jid: @options.jid, name: @options.name, password: @options.password)
    mention = new RegExp("@#{@options.name.split(' ')[0]}\\b", "i")
    console.log mention
    console.log "Bot:", bot

    bot.onConnect =>
      console.log "Connected to HipChat"
      if @options.rooms is "@All"
        @get "/v1/rooms/list", (err, response) ->
          if response
            for room in response.rooms
              console.log "Joining #{room.xmpp_jid}"
              bot.join room.xmpp_jid
          else
            console.log "Can't list rooms: #{err}"
      else
        for room_id in @options.rooms.split(',')
          console.log "Joining #{room_id}"
          bot.join room_id

      @get "/v1/users/list", (err, response) ->
        if response
          for user in response.users
            self.userForId user.user_id, user
        else
          console.log "Can't list rooms: #{err}"

    bot.onError (message) ->
      # If HipChat sends an error, we get the error message from XMPP.
      # Otherwise, we get an Error object from the Node connection.
      if message.message
        console.log "Error talking to HipChat:", message.message
      else
        console.log "Received error from HipChat:", message

    bot.onMessage (channel, from, message) ->
      author = name: from, reply_to: channel
      hubot_msg = message.replace(mention, "#{self.name}: ")
      self.receive new Robot.TextMessage(author, hubot_msg)

    bot.onPrivateMessage (from, message) =>
      user = self.userForId(from.match(/_(\d+)@/)[1])
      author = name: user.name, reply_to: from
      self.receive new Robot.TextMessage(author, "#{self.name}: #{message}")

    bot.connect()

    @bot = bot

  # Convenience HTTP Methods for posting on behalf of the token"d user
  get: (path, callback) ->
    @request "GET", path, null, callback

  post: (path, body, callback) ->
    @request "POST", path, body, callback

  request: (method, path, body, callback) ->
    console.log method, path, body
    headers = "Host": "api.hipchat.com"

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
          callback null, data or { }
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

module.exports = HipChat

