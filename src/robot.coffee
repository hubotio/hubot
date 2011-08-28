Fs   = require 'fs'
Url  = require 'url'
Path = require 'path'

class Robot
  # Robots receive messages from a chat source (Campfire, irc, etc), and
  # dispatch them to matching listeners.
  #
  # path - String directory full of Hubot scripts to load.
  constructor: (path) ->
    @listeners = []
    if path then @load path

  # Public: Adds a Listener that attempts to match incoming messages based on
  # a Regex.
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  hear: (regex, callback) ->
    @listeners.push new Listener(@, regex, callback)

  # Public: Passes the given message to any interested Listeners.
  #
  # message - A Robot.Message instance.
  #
  # Returns nothing.
  receive: (message) ->
    @listeners.forEach (lst) -> lst.call message

  # Public: Loads every script in the given path.
  #
  # path - A String path on the filesystem.
  #
  # Returns nothing.
  load: (path) ->
    Fs.readdirSync(path).forEach (file) =>
      ext  = Path.extname file
      full = Path.join path, Path.basename(file, ext)
      if ext == '.coffee' or ext == '.js'
        require(full) @

  # Public: Raw method for sending data back to the chat source.  Extend this.
  #
  # user    - A Robot.User instance.
  # strings - One or more Strings for each message to send.
  send: (user, strings...) ->

  # Public: Raw method for building a reply and sending it back to the chat
  # source. Extend this.
  #
  # user    - A Robot.User instance.
  # strings - One or more Strings for each reply to send.
  reply: (user, strings...) ->

  # Public: Raw method for invoking the bot to run
  # Extend this.
  run: ->

class Robot.User
  # Represents a participating user in the chat.
  #
  # id      - A unique ID for the user.
  # name    - A String name of the user.
  # options - An optional Hash of key, value pairs for this user.
  constructor: (@id, @name, options) ->
    for key, value of (options or {})
      this[key] = value

class Robot.Message
  # Represents an incoming message from the chat.
  #
  # user - A Robot.User instance that sent the message.
  # text - The String message contents.
  constructor: (@user, @text) ->

  # Determines if the message matches the given regex.
  #
  # regex - The Regex to check.
  #
  # Returns a Match object or null.
  match: (regex) ->
    @text.match regex

class Listener
  # Listeners receive every message from the chat source and decide if they want
  # to act on it.
  #
  # robot    - The current Robot instance.
  # regex    - The Regex that determines if this listener should trigger the
  #            callback.
  # callback - The Function that is triggered if the incoming message matches.
  constructor: (@robot, @regex, @callback) ->

  # Public: Determines if the listener likes the content of the message.  If
  # so, a Response built from the given Message is passed to the Listener
  # callback.
  #
  # message - a Robot.Message instance.
  #
  # Returns nothing.
  call: (message) ->
    if match = message.match @regex
      @callback new Response(@robot, message, match)

class Response
  # Public: Responses are sent to matching listeners.  Messages know about the
  # content and user that made the original message, and how to reply back to
  # them.
  #
  # robot   - The current Robot instance.
  # message - The current Robot.Message instance.
  # match   - The Match object from the successful Regex match.
  constructor: (@robot, @message, @match) ->

  # Public: Posts a message back to the chat source
  #
  # strings - One or more strings to be posted.  The order of these strings
  #           should be kept intact.
  #
  # Returns nothing.
  send: (strings...) ->
    @robot.send @message.user, strings...

  # Public: Posts a message mentioning the current user.
  #
  # strings - One or more strings to be posted.  The order of these strings
  #           should be kept intact.
  #
  # Returns nothing.
  reply: (strings...) ->
    @robot.reply @message.user, strings...

  # Public: Picks a random item from the given items.
  #
  # items - An Array of items (usually Strings).
  #
  # Returns a random item.
  random: (items) ->
    items[ Math.floor(Math.random() * items.length) ]

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

  # Deprecated: Helper for making quick HTTP GET requests.
  # otherwise, use @http for the rad Node 0.4 HTTP Client.
  #
  # url - String URL to GET.
  # cb  - Function callback that is triggered with the HTTP response.
  #
  # Returns nothing.
  fetch: (url, cb) ->
    @http(url).get() (err, res, body) ->
      res.body = body
      cb res

Response.prototype.httpClient = require 'scoped-http-client'

module.exports = Robot
