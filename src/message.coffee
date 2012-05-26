class Message
  # Represents an incoming message from the chat.
  #
  # user - A User instance that sent the message.
  constructor: (@user, @done = false) ->

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
  constructor: (@user, @text) ->
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
class EnterMessage extends Message

# Represents an incoming user exit notification.
#
# user - A User instance for the user who left.
class LeaveMessage extends Message

class CatchAllMessage extends Message
  # Represents a message that no matchers matched.
  #
  # message - The original message.
  constructor: (@message) ->

module.exports.Message         = Message
module.exports.TextMessage     = TextMessage
module.exports.EnterMessage    = EnterMessage
module.exports.LeaveMessage    = LeaveMessage
module.exports.CatchAllMessage = CatchAllMessage
