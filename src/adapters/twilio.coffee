Robot = require '../robot'
HTTP  = require 'http'
QS    = require 'querystring'

class Twilio extends Robot.Adapter
  constructor: ->
    @sid   = process.env.HUBOT_SMS_SID
    @token = process.env.HUBOT_SMS_TOKEN
    @from  = process.env.HUBOT_SMS_FROM
    super()

  send: (user, strings...) ->
    message = strings.join "\n"

    for msg in @split_long_sms(message)
      @send_sms message, user.id, (err, body) ->
        if err or not body?
          console.log "Error sending reply SMS: #{err}"
        else
          console.log "Sending reply SMS: #{message} to #{user.id}"

  reply: (user, strings...) ->
    @send user, str for str in strings

  respond: (regex, callback) ->
    @hear regex, callback

  run: ->
    server = HTTP.createServer (request, response) =>
      payload = QS.parse(request.url)

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
    auth = new Buffer(@sid + ':' + @token).toString("base64")
    data = QS.stringify From: @from, To: to, Body: message

    @http("https://api.twilio.com")
      .path("/2010-04-01/Accounts/#{@sid}/SMS/Messages.json")
      .header("Authorization", "Basic #{auth}")
      .header("Content-Type", "application/x-www-form-urlencoded")
      .post(data) (err, res, body) ->
        if err
          callback err
        else if res.statusCode is 201
          json = JSON.parse(body)
          callback null, body
        else
          json = JSON.parse(body)
          callback body.message

  split_long_sms: (message) ->
    strs = []
    while str.length > 150
      pos = str.substring(0, 150).lastIndexOf(" ")
      pos = (if pos <= 0 then 150 else pos)
      strs.push str.substring(0, pos)
      i = str.indexOf(" ", pos) + 1
      i = pos  if i < pos or i > pos + 150
      str = str.substring(i)
    strs.push str
    strs

module.exports = Twilio
