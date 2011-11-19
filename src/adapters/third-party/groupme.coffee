Robot = require('hubot').robot()

HTTP  = require 'http'
HTTPS = require 'https'
URL   = require 'url'

class GroupMe extends Robot.Adapter
  send: (user, strings...) ->
    strings.forEach (str) =>
      if str.match(/(png|jpg)$/i)
        @upload_image str, (url) =>
          @send_message picture_url: url
      else
        @send_message text:str

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"

  run: ->
    @room_id = process.env.HUBOT_GROUPME_ROOM
    @token   = process.env.HUBOT_GROUPME_TOKEN

    @timer = setInterval =>
      @fetch_messages (messages) =>
        for msg in messages
          @last_id = msg.id

          if msg.text and (msg.created_at * 1000) > new Date().getTime() - 5*1000
            console.log "#{msg.name}: #{msg.text}"
            @receive new Robot.Message msg.name, msg.text
    , 1500

  upload_image: (url, cb) ->
    console.log "upload: #{url}"
    uri = URL.parse url

    options =
      agent: false

      host: uri.hostname
      port: uri.port || 80
      path: uri.pathname + (uri.search || '')

    request = (if uri.protocol == 'http:' then HTTP else HTTPS).request options, (response) =>
      response.setEncoding('binary')
      data = ''
      response.on 'data', (chunk)-> data += chunk
      response.on 'end', =>
        boundary = '-----AaB03x'

        multipartBody =
          "--#{boundary}\r\n" +
          "Content-Type: image/jpeg\r\n" +
          "Content-Transfer-Encoding: binary\r\n" +
          "Content-Disposition: form-data; name=\"Filedata\"; filename=\"image.jpg\"\r\n\r\n" +
          new Buffer(data) +
          "\r\n--#{boundary}--"

        options =
          agent: false
          host: 'groupme-image-service.heroku.com'
          port: 80
          path: '/images'
          method: 'POST'
          headers:
            'Content-Type': 'multipart/form-data; boundary='+boundary
            'Content-Length': multipartBody.length

        request = HTTP.request options, (response) =>
          data = ''
          response.on 'data', (chunk)-> data += chunk
          response.on 'end', ->
            json = JSON.parse(data)
            if json.payload
              cb(json.payload.picture_url)
        request.end(multipartBody, 'binary')
    request.end()

  send_message: (msg) ->
    msg.name = 'Hubot'
    json = JSON.stringify(message: msg)

    options =
      agent: false
      host: 'v2.groupme.com'
      port: 80
      method: 'POST'
      path: "/groups/#{@room_id}/messages?token=#{@token}"
      headers:
        'Content-Length': json.length
        'Content-Type': 'application/json'

    request = HTTP.request options, (response) ->
      data = ''
      response.on 'data', (chunk)-> data += chunk
      response.on 'end', ->
        console.log(data)
    request.end(json)

  fetch_messages: (cb) ->
    options =
      agent: false
      host: 'v2.groupme.com'
      port: 80
      method: 'GET'
      path: "/groups/#{@room_id}/messages?token=#{@token}"

    if @last_id
      options.path += "&since_id=#{@last_id}"

    request = HTTP.request options, (response) =>
      data = ''
      response.on 'data', (chunk) -> data += chunk
      response.on 'end', =>
        if data
          json = JSON.parse(data)
          cb(json.response.messages.reverse())
    request.end()

exports.use = (robot) ->
  new GroupMe robot

