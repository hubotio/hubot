Robot      = require './robot'

class Adapter
  # An adapter is a specific interface to a chat source for robots.
  #
  # robot - A Robot instance.
  constructor: (@robot) ->
    @httpClient = require 'scoped-http-client'

  # Public: Raw method for sending data back to the chat source.  Extend this.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  send: (user, strings...) ->

  # Public: Raw method for building a reply and sending it back to the chat
  # source. Extend this.
  #
  # user    - A User instance.
  # strings - One or more Strings for each reply to send.
  reply: (user, strings...) ->

  # Public: Raw method for setting a topic on the chat source. Extend this.
  #
  # user    - A User instance
  # strings - One more more Strings to set as the topic.
  topic: (user, strings...) ->

  # Public: Raw method for invoking the bot to run
  # Extend this.
  run: ->

  # Public: Raw method for shutting the bot down.
  # Extend this.
  close: ->
    @robot.brain.close()

  # Public: Dispatch a received message to the robot.
  #
  # message - A TextMessage instance of the received message.
  #
  # Returns nothing.
  receive: (message) ->
    @robot.receive message

  # Public: Get an Array of User objects stored in the brain.
  users: ->
    @robot.users

  # Public: Get a User object given a unique identifier
  userForId: (id, options) ->
    @robot.userForId id, options

  # Public: Get a User object given a name
  userForName: (name) ->
    @robot.userForName name

  # Public: Get all users whose names match fuzzyName. Currently, match
  # means 'starts with', but this could be extended to match initials,
  # nicknames, etc.
  #
  usersForRawFuzzyName: (fuzzyName) ->
    @robot.usersForRawFuzzyName fuzzyName

  # Public: If fuzzyName is an exact match for a user, returns an array with
  # just that user. Otherwise, returns an array of all users for which
  # fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
  #
  usersForFuzzyName: (fuzzyName) ->
    @robot.usersForFuzzyName fuzzyName

  # Public: Creates a scoped http client with chainable methods for
  # modifying the request.  This doesn't actually make a request though.
  # Once your request is assembled, you can call `get()`/`post()`/etc to
  # send the request.
  #
  # url - String URL to access.
  #
  # Examples:
  #
  #     res.http("http://example.com")
  #       # set a single header
  #       .header('Authorization', 'bearer abcdef')
  #
  #       # set multiple headers
  #       .headers(Authorization: 'bearer abcdef', Accept: 'application/json')
  #
  #       # add URI query parameters
  #       .query(a: 1, b: 'foo & bar')
  #
  #       # make the actual request
  #       .get() (err, res, body) ->
  #         console.log body
  #
  #       # or, you can POST data
  #       .post(data) (err, res, body) ->
  #         console.log body
  #
  # Returns a ScopedClient instance.
  http: (url) ->
    @httpClient.create(url)

module.exports = Adapter

