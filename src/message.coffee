class Message
  constructor: (@user, @done = false) ->
    @room = @user.room

  finish: ->
    @done = true

class TextMessage extends Message
  constructor: (@user, @text, @id) ->
    super @user

  match: (regex) ->
    @text.match regex

class EnterMessage extends Message

class LeaveMessage extends Message

class TopicMessage extends Message

class CatchAllMessage extends Message
  constructor: (@message) ->

module.exports = {
  Message
  TextMessage
  EnterMessage
  LeaveMessage
  TopicMessage
  CatchAllMessage
}
