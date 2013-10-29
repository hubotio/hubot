class Message
  # Represents an incoming message from the chat.
  #
  # user - A User instance that sent the message.
  constructor: (@user, @done = false) ->
    @room = @user.room

  # Indicates that no other Listener should be called on this object
  #
  # Returns nothing.
  finish: ->
    @done = true

class TextMessage extends Message
  # Represents an incoming message from the chat.
  #
  # user - A User instance that sent the message.
  # text - A String message.
  # id   - A String of the message ID.
  constructor: (@user, @text, @id) ->
    super @user

  # Determines if the message matches the given regex.
  #
  # regex - A Regex to check.
  #
  # Returns a Match object or null.
  match: (regex) ->
    @text.match regex

# Represents an incoming user entrance notification.
#
# user - A User instance for the user who entered.
# text - Always null.
# id   - A String of the message ID.
class EnterMessage extends Message

# Represents an incoming user exit notification.
#
# user - A User instance for the user who left.
# text - Always null.
# id   - A String of the message ID.
class LeaveMessage extends Message

# Represents an incoming topic change notification.
#
# user - A User instance for the user who changed the topic.
# text - A String of the new topic
# id   - A String of the message ID.
class TopicMessage extends TextMessage

class CatchAllMessage extends Message
  # Represents a message that no matchers matched.
  #
  # message - The original message.
  constructor: (@message) ->
    super @message.user

module.exports = {
  Message
  TextMessage
  EnterMessage
  LeaveMessage
  TopicMessage
  CatchAllMessage
}
