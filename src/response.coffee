class Response
  constructor: (@robot, @message, @match) ->
    @envelope =
      room: @message.room
      user: @message.user
      message: @message

  send: (strings...) ->
    @robot.adapter.send @envelope, strings...

  reply: (strings...) ->
    @robot.adapter.reply @envelope, strings...

  topic: (strings...) ->
    @robot.adapter.topic @envelope, strings...

  play: (strings...) ->
    @robot.adapter.play @envelope, strings...

  random: (items) ->
    items[ Math.floor(Math.random() * items.length) ]

  finish: ->
    @message.finish()

  http: (url) ->
    @robot.http(url)

module.exports = Response
