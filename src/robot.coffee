Fs    = require 'fs'
Url   = require 'url'
Path  = require 'path'
Redis = require 'redis'

class Robot
  # Robots receive messages from a chat source (Campfire, irc, etc), and
  # dispatch them to matching listeners.
  #
  # path - String directory full of Hubot scripts to load.
  constructor: (path, name = "Hubot") ->
    @name        = name
    @brain       = new Robot.Brain()
    @commands    = []
    @Response    = Robot.Response
    @listeners   = []
    @loadPaths   = []
    @enableSlash = false
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

  # Public: Adds a Listener that attempts to match incoming messages directed
  # at the robot based on a Regex.  All regexes treat patterns like they begin
  # with a '^'
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  respond: (regex, callback) ->
    re = regex.toString().split("/")
    re.shift()           # remove empty first item
    modifiers = re.pop() # pop off modifiers

    if re[0] and re[0][0] is "^"
      console.log "\nWARNING: Anchors don't work well with respond, perhaps you want to use 'hear'"
      console.log "WARNING: The regex in question was #{regex.toString()}\n"

    pattern = re.join("/") # combine the pattern back again
    if @enableSlash
      newRegex = new RegExp("^(?:\/|#{@name}:?)\\s*#{pattern}", modifiers)
    else
      newRegex = new RegExp("^#{@name}:?\\s*#{pattern}", modifiers)

    @listeners.push new Listener(@, newRegex, callback)

  # Public: Passes the given message to any interested Listeners.
  #
  # message - A Robot.Message instance.
  #
  # Returns nothing.
  receive: (message) ->
    listener.call message for listener in @listeners

  # Public: Loads every script in the given path.
  #
  # path - A String path on the filesystem.
  #
  # Returns nothing.
  load: (path) ->
    Path.exists path, (exists) =>
      if exists
        @loadPaths.push path
        for file in Fs.readdirSync(path)
          @loadFile path, file

  # Public: Loads a file in path
  #
  # path - A String path on the filesystem.
  # file - A String filename in path on the filesystem.
  #
  # Returns nothing.
  loadFile: (path, file) ->
    ext  = Path.extname file
    full = Path.join path, Path.basename(file, ext)
    if ext is '.coffee' or ext is '.js'
      require(full) @
      @parseHelp "#{path}/#{file}"

  # Public: Help Commands for Running Scripts
  #
  # Returns an array of help commands for running scripts
  #
  helpCommands: () ->
    @commands.sort()

  # Private: load help info from a loaded script
  #
  # path - The path to the file on disk
  #
  # Returns nothing
  parseHelp: (path) ->
    Fs.readFile path, "utf-8", (err, body) =>
      throw err if err
      for i, line of body.split("\n")
        break    if line[0] != '#'
        continue if !line.match('-')
        @commands.push line[2..line.length]

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

  users: () ->
    @brain.data.users

  # Public: Get a User object given a unique identifier
  #
  userForId: (id, options) ->
    user = @brain.data.users[id]
    unless user
      user = new Robot.User id, options
      @brain.data.users[id] = user
    user

  # Public: Get a User object given a name
  #
  userForName: (name) ->
    result = null
    lowerName = name.toLowerCase()
    for k of (@brain.data.users or { })
      if @brain.data.users[k]['name'].toLowerCase() is lowerName
        result = @brain.data.users[k]
    result

class Robot.User
  # Represents a participating user in the chat.
  #
  # id      - A unique ID for the user.
  # options - An optional Hash of key, value pairs for this user.
  constructor: (@id, options = { }) ->
    for k of (options or { })
      @[k] = options[k]

class Robot.Brain
  # Represents somewhat persistent storage for the robot.
  #
  # Returns a new Brain that's trying to connect to redis
  #
  # Previously persisted data is loaded on a successful connection
  #
  # Redis connects to a environmental variable REDISTOGO_URL or
  # fallsback to localhost
  constructor: () ->
    @data =
      users: { }

    info = Url.parse process.env.REDISTOGO_URL || 'redis://localhost:6379'
    @client = Redis.createClient(info.port, info.hostname)

    if info.auth
      @client.auth info.auth.split(":")[1]

    @client.on "error", (err) ->
      console.log "Error #{err}"
    @client.on "connect", () =>
      console.log "Successfully connected to Redis"
      @client.get "hubot:storage", (err, reply) =>
        throw err if err
        @mergeData JSON.parse reply.toString() if reply

      setInterval =>
        data = JSON.stringify @data
        @client.set "hubot:storage", data, (err, reply) ->
          # console.log "Saved #{reply.toString()}"
      , 5000

  # Merge keys loaded from redis against the in memory representation
  #
  # Returns nothing
  #
  # Caveats: Deeply nested structures don't merge well
  mergeData: (data) ->
    for k of (data or { })
      @data[k] = data[k]

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
  # Listeners receive every message from the chat source and decide if they
  # want to act on it.
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
      @callback new @robot.Response(@robot, message, match)

class Robot.Response
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

Robot.Response.prototype.httpClient = require 'scoped-http-client'

module.exports = Robot
