Fs           = require 'fs'
Url          = require 'url'
Path         = require 'path'
EventEmitter = require('events').EventEmitter

class Robot
  # Robots receive messages from a chat source (Campfire, irc, etc), and
  # dispatch them to matching listeners.
  #
  # path - String directory full of Hubot scripts to load.
  constructor: (options = { }) ->
    @name        = options.name || "Hubot"
    @brain       = new Robot.Brain
    @commands    = []
    @Response    = Robot.Response
    @listeners   = []
    @loadPaths   = []
    @enableSlash = !!options.enableSlash
    @debugStream = options.debugStream
    @errStream   = options.errStream
    @errStream   = process.stderr if @errStream is undefined

  # Public: Adds a Listener that attempts to match incoming messages based on
  # a Regex.
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  hear: (regex, callback) ->
    @addListener TextListener, regex, callback

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
      @warn "\nWARNING: Anchors don't work well with respond, perhaps you want to use 'hear'"
      @warn "WARNING: The regex in question was #{regex.toString()}\n"

    pattern = re.join("/") # combine the pattern back again
    if @enableSlash
      newRegex = new RegExp("^(?:\/|#{@name}[:,]?)\\s*(?:#{pattern})", modifiers)
    else
      newRegex = new RegExp("^#{@name}[:,]?\\s*(?:#{pattern})", modifiers)

    @addListener TextListener, newRegex, callback

  # Public: Adds a Listener that triggers when anyone enters the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  enter: (callback) ->
    @addListener Listener, ((msg) -> msg instanceof Robot.EnterMessage), callback

  # Public: Adds a Listener that triggers when anyone leaves the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  leave: (callback) ->
    @addListener Listener, ((msg) -> msg instanceof Robot.LeaveMessage), callback

  # Private: Instantiates and adds a Listener by type
  #
  # type - A Listener class
  addListener: (type, args...) ->
    listener = new type(@, args...)
    @debug "matching #{listener.regex}" if listener.regex
    @listeners.push listener

  # Public: Passes the given message to any interested Listeners.
  #
  # message - A Robot.Message instance.
  #
  # Returns nothing.
  receive: (message) ->
    someMatched = false
    for lst in @listeners
      try
        someMatched = true if lst.call message
      catch ex
        @warn "error while calling listener: #{ex}"

    @noMatch message unless someMatched

  # Called when no listener matched a message passed to `receive`
  noMatch: (message) ->

  # Public: Loads every script in the given path.
  #
  # path - A String path on the filesystem.
  # callback - A Function called once loading is complete
  #
  # Returns nothing.
  load: (path, callback) ->
    Path.exists path, (exists) =>
      if exists
        @loadPaths.push path
        files = Fs.readdirSync(path)
        remaining = files.length
        cb = -> callback exists if --remaining is 0 and callback
        @loadFile path, file, cb for file in files
      else
        callback? exists

  # Public: Loads a file in path
  #
  # path - A String path on the filesystem.
  # file - A String filename in path on the filesystem.
  # callback - A Function called once loading is complete
  #
  # Returns nothing.
  loadFile: (path, file, callback) ->
    ext  = Path.extname file
    full = Path.join path, Path.basename(file, ext)
    if ext is '.coffee' or ext is '.js'
      require(full) @
      @parseHelp "#{full}#{ext}", callback

  # Public: Help Commands for Running Scripts
  #
  # Returns an array of help commands for running scripts
  #
  helpCommands: () ->
    @commands.sort()

  # Private: load help info from a loaded script
  #
  # path - The path to the file on disk
  # callback - A Function called once parsing is complete
  #
  # Returns nothing
  parseHelp: (path, callback) ->
    Fs.readFile path, "utf-8", (err, body) =>
      throw err if err
      for i, line of body.split("\n")
        break    if !(line[0] == '#' or line.substr(0, 2) == '//')
        continue if !line.match('-')
        @commands.push line[2..line.length]
      callback?()

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

  # Public: Raw method for setting a topic on the chat source. Extend this.
  #
  # user    - A Robot.User instance
  # strings - One more more Strings to set as the topic.
  topic: (user, strings...) ->

  # Public: Raw method for invoking the bot to run
  # Extend this.
  run: ->

  # Public: Raw method for shutting the bot down.
  # Extend this.
  close: ->
    @brain.close()

  debug: (msg) ->
    @debugStream.write msg.toString() + "\n", 'utf8' if @debugStream

  warn: (msg) ->
    @errStream.write msg.toString() + "\n", 'utf8' if @errStream

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

# http://www.the-isb.com/images/Nextwave-Aaron01.jpg
class Robot.Brain extends EventEmitter
  # Represents somewhat persistent storage for the robot.
  #
  # Returns a new Brain with no external storage.  Extend this!
  constructor: () ->
    @data =
      users: { }

    @resetSaveInterval 5

  save: ->
    @emit 'save', @data

  close: ->
    clearInterval @saveInterval
    @save()
    @emit 'close'

  resetSaveInterval: (seconds) ->
    clearInterval @saveInterval if @saveInterval
    @saveInterval = setInterval =>
      @save()
    , seconds * 1000

  # Merge keys loaded from a DB against the in memory representation
  #
  # Returns nothing
  #
  # Caveats: Deeply nested structures don't merge well
  mergeData: (data) ->
    for k of (data or { })
      @data[k] = data[k]

    @emit 'loaded', @data

class Robot.Message
  # Represents an incoming message from the chat.
  #
  # user - A Robot.User instance that sent the message.
  constructor: (@user) ->

class Robot.TextMessage extends Robot.Message
  # Represents an incoming message from the chat.
  #
  # user - A Robot.User instance that sent the message.
  # text - The String message contents.
  constructor: (@user, @text) ->
    super @user

  # Determines if the message matches the given regex.
  #
  # regex - The Regex to check.
  #
  # Returns a Match object or null.
  match: (regex) ->
    @text.match regex

# Represents an incoming user entrance notification.
#
# user - A Robot.User instance for the user who entered.
class Robot.EnterMessage extends Robot.Message

# Represents an incoming user exit notification.
#
# user - A Robot.User instance for the user who left.
class Robot.LeaveMessage extends Robot.Message

class Listener
  # Listeners receive every message from the chat source and decide if they
  # want to act on it.
  #
  # robot    - The current Robot instance.
  # matcher  - The Function that determines if this listener should trigger the
  #            callback.
  # callback - The Function that is triggered if the incoming message matches.
  constructor: (@robot, @matcher, @callback) ->

  # Public: Determines if the listener likes the content of the message.  If
  # so, a Response built from the given Message is passed to the Listener
  # callback.
  #
  # message - a Robot.Message instance.
  #
  # Returns nothing.
  call: (message) ->
    if match = @matcher message
      @callback new @robot.Response(@robot, message, match)
      return true

class TextListener extends Listener
  # TextListeners receive every message from the chat source and decide if they want
  # to act on it.
  #
  # robot    - The current Robot instance.
  # regex    - The Regex that determines if this listener should trigger the
  #            callback.
  # callback - The Function that is triggered if the incoming message matches.
  constructor: (@robot, @regex, @callback) ->
    @matcher = (message) =>
      if message instanceof Robot.TextMessage
        message.match @regex

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

  # Public: Posts a topic changing message
  #
  # strings - One or more strings to set as the topic of the
  #           room the bot is in.
  #
  # Returns nothing.
  topic: (strings...) ->
    @robot.topic @message.user, strings...

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
