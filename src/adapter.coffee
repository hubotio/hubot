{EventEmitter} = require 'events'

class Adapter extends EventEmitter
  # An adapter is a specific interface to a chat source for robots.
  #
  # robot - A Robot instance.
  constructor: (@robot) ->

  # Public: Raw method for sending data back to the chat source. Extend this.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  send: (user, strings...) ->

  # Public: Raw method for building a reply and sending it back to the chat
  # source. Extend this.
  #
  # user    - A User instance.
  # strings - One or more Strings for each reply to send.
  #
  # Returns nothing.
  reply: (user, strings...) ->

  # Public: Raw method for setting a topic on the chat source. Extend this.
  #
  # user    - A User instance.
  # strings - One more more Strings to set as the topic.
  #
  # Returns nothing.
  topic: (user, strings...) ->

  # Public: Raw method for invoking the bot to run. Extend this.
  #
  # Returns nothing.
  run: ->

  # Public: Raw method for shutting the bot down. Extend this.
  #
  # Returns nothing.
  close: ->

  # Public: Dispatch a received message to the robot.
  #
  # Returns nothing.
  receive: (message) ->
    @robot.receive message

  # Public: Get an Array of User objects stored in the brain.
  #
  # Returns an Array of User objects.
  users: ->
    @robot.users

  # Public: Get a User object given a unique identifier.
  #
  # Returns a User instance of the specified user.
  userForId: (id, options) ->
    @robot.userForId id, options

  # Public: Get a User object given a name.
  #
  # Returns a User instance for the user with the specified name.
  userForName: (name) ->
    @robot.userForName name

  # Public: Get all users whose names match fuzzyName. Currently, match
  # means 'starts with', but this could be extended to match initials,
  # nicknames, etc.
  #
  # Returns an Array of User instances matching the fuzzy name.
  usersForRawFuzzyName: (fuzzyName) ->
    @robot.usersForRawFuzzyName fuzzyName

  # Public: If fuzzyName is an exact match for a user, returns an array with
  # just that user. Otherwise, returns an array of all users for which
  # fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
  #
  # Returns an Array of User instances matching the fuzzy name.
  usersForFuzzyName: (fuzzyName) ->
    @robot.usersForFuzzyName fuzzyName

  # Public: Creates a scoped http client with chainable methods for
  # modifying the request. This doesn't actually make a request though.
  # Once your request is assembled, you can call `get()`/`post()`/etc to
  # send the request.
  #
  # Returns a ScopedClient instance.
  http: (url) ->
    @robot.http(url)

module.exports = Adapter
