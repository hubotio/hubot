Robot        = require "../robot"
HTTPS        = require "https"
URL   			 = require 'url'

class Jaconda extends Robot
  
  send: (user, strings... ) ->
    for str in strings
      @post_message str

  reply: (user, strings... ) ->
    for str in strings
      @send user, "#{user.name}: #{str}"

  topic: (user, strings... ) ->
    for str in strings
      @update_topic str

  # Public: Raw method for invoking the bot to run
  # Extend this.
  run: ->
    @account_id = process.env.HUBOT_JACONDA_ACCOUNT
    @room_id 	  = process.env.HUBOT_JACONDA_ROOM
    @api_token  = process.env.HUBOT_JACONDA_API_TOKEN

    @last_id = 0

    @timer = setInterval =>
      @fetch_messages (messages) =>
        for msg in messages
          @last_id = msg.message.id
          if msg.message.text and (new Date(msg.message.updated_at).getTime()) > new Date().getTime() - 8*1000
            console.log "#{msg.message.sender_name}: #{msg.message.text}"
            @receive new Robot.TextMessage msg.message.sender_name, msg.message.text
    , 2000


  # # Public: Raw method for shutting the bot down.
  # # Extend this.
  close: ->
    clearInterval @timer

  fetch_messages: (callback) ->
    options =
      agent: false
      host: "#{@account_id}.jaconda.im"
      port: 443
      method: 'GET'
      path: "/api/v2/rooms/#{@room_id}/messages.json?per_page=200"
      headers:
        Host: "#{@account_id}.jaconda.im"
        Authorization: "Basic " + new Buffer("#{@api_token}:x").toString("base64")
      

    request = HTTPS.request options, (response) =>
      data = ''
      response.on 'data', (chunk) -> data += chunk
      response.on 'end', =>
        if data
          json = JSON.parse(data)
          if json?
            filtered_messages = json.filter (message) =>
              message.message.id > @last_id
            callback(filtered_messages) if filtered_messages?
    request.end()

  post_message: (message) ->
    
    formatted_message = "{message: {text: #{JSON.stringify(message)}}}"
    console.log("message is formatted to #{formatted_message}")
    
    options =
      agent: false
      host: "#{@account_id}.jaconda.im"
      port: 443
      method: 'POST'
      path: "/api/v2/rooms/#{@room_id}/messages.json"
      headers:
        Host: "#{@account_id}.jaconda.im"
        Authorization: "Basic " + new Buffer("#{@api_token}:x").toString("base64")
        "Content-Type": "application/json"
        "Content-Length" : formatted_message.length


    request = HTTPS.request options, (response) =>
      data = ''
      response.on 'data', (chunk) -> data += chunk
      response.on 'end', =>
        console.log(data)
    request.end(formatted_message)

  update_topic: (topic) ->
    
    formatted_topic = "{room: {topic: #{JSON.stringify(topic)}}}"
    
    options =
      agent: false
      host: "#{@account_id}.jaconda.im"
      port: 443
      method: 'PUT'
      path: "/api/v2/rooms/#{@room_id}.json"
      headers:
        "Host"          : "#{@account_id}.jaconda.im"
        "Authorization" : "Basic " + new Buffer("#{@api_token}:x").toString("base64")
        "Content-Type"  : "application/json"
        "Content-Length" : formatted_topic.length


    request = HTTPS.request options, (response) =>
      data = ''
      response.on 'data', (chunk) -> data += chunk
      response.on 'end', =>
        console.log(data)
    request.end(formatted_topic)


module.exports = Jaconda
