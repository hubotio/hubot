Robot = require '../robot'
HTTP  = require 'http'
Qs    = require 'querystring'

class Twilio extends Robot
  constructor: ->
    @sid   = process.env.HUBOT_SMS_SID
    @token = process.env.HUBOT_SMS_TOKEN
    @from  = process.env.HUBOT_SMS_FROM
    super()

  send: (user, strings...) ->
    message = strings.join "\n"
    console.log "Sending reply SMS: #{message} to #{user.id}"
    @send_sms message, user.id, (err, body) =>
      if err or not body?
        console.log "error sending reply SMS: #{err}"

  reply: (user, strings...) ->
    for str in strings
      @send user, "#{user.name}: #{str}"

  respond: (regex, callback) ->
    @hear regex, callback

  run: ->
    server = HTTP.createServer (request, response) =>
      payload = Qs.parse(request.url)

      if payload.Body? and payload.From?
        console.log "Received SMS: #{payload.Body} from #{payload.From}"
        @receive_sms(payload.Body, payload.From)

      response.writeHead 200, 'Content-Type': 'text/plain'
      response.end()

    server.listen (parseInt(process.env.PORT) or 8080), "0.0.0.0"

  receive_sms: (body, from) ->
    return if body.length is 0
    user = @userForId from
    @receive new Robot.TextMessage user, body

  send_sms: (message, to, callback) ->
    # rework to use scoped-http-client here
    console.log "#{to}: #{message}"

module.exports = Twilio

