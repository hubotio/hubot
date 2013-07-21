class Message
  # Represents an incoming message from the chat.
  #
  constructor: (@type, options) ->
    options ?= {}
    @user = options.user
    @room = @user?.room
    @text = options.text
    @id = options.id
    @done = false

  # Indicates that no other Listener should be called on this object
  #
  # Returns nothing.
  finish: ->
    @done = true

  # Determines if the message matches the given regex.
  #
  # regex - A Regex to check.
  #
  # Returns a Match object or null.
  match: (regex) ->
    @text.match regex if @text?

module.exports = Message
