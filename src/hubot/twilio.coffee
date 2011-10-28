Robot = require '../robot'
Http  = require 'http'
Https = require 'https'
Qs    = require 'querystring'

class Twilio extends Robot
  constructor: ->
    @config =
      sid: process.env.HUBOT_SMS_SID
      token: process.env.HUBOT_SMS_TOKEN
      from: process.env.HUBOT_SMS_FROM
    super

  send: (user, strings...) ->
    message = strings.join "\n"
    @post message, user.id, (error, body) ->
      if error or not body
        console.log "error sending response: #{error}"
      else
        console.log "successful sending #{body}"

  reply: (user, strings...) ->
    for str in strings
      @send user, "#{user.name}: #{str}"

  respond: (regex, callback) ->
    @hear regex, callback

  run: ->
    console.log "Hubot: the SMS reader."

    server = Http.createServer (request, response) =>
      payload = Qs.parse(request.url)

      @handle payload.Body, payload.From if payload.Body and payload.From

      response.writeHead 200, 'Content-Type': 'text/plain'
      response.end()

    server.listen (parseInt(process.env.PORT) or 8080), "0.0.0.0"

  handle: (body, from) ->
    return if body.length is 0
    user = @userForId from
    @receive new Robot.TextMessage user, body

  post: (message, to, callback) ->
    host = "api.twilio.com"
    path = "/2010-04-01/Accounts/#{@config.sid}/SMS/Messages.json"

    auth = new Buffer(@config.sid + ':' + @config.token).toString("base64")

    headers =
      'Authorization': "Basic " + auth
      'Content-Type': "application/x-www-form-urlencoded"
      'Host': host

    params = Qs.stringify
      'From': @config.from
      'To': to
      'Body': message

    headers['Content-Length'] = params.length

    opts =
      host: host
      port: 443
      method: "POST"
      path: path
      headers: headers

    request = Https.request opts, (response) ->
      data = ""

      response.setEncoding "utf8"

      response.on "data", (chunk) ->
        data += chunk

      response.on "end", ->
        body = JSON.parse data

        if response.statusCode is 201
          callback null, body
        else
          callback body.message

    request.write params
    request.end()

module.exports = Twilio

