Fs      = require 'fs'
Url     = require 'url'
Log     = require 'log'
Path    = require 'path'
Connect = require 'connect'

User    = require './user'
Brain   = require './brain'

HUBOT_DEFAULT_ADAPTERS = [ "campfire", "shell" ]

class Robot
  # Robots receive messages from a chat source (Campfire, irc, etc), and
  # dispatch them to matching listeners.
  #
  # path - String directory full of Hubot scripts to load.
  constructor: (adapterPath, adapter, httpd, name = "Hubot") ->
    @name        = name
    @brain       = new Brain
    @alias       = false
    @adapter     = null
    @commands    = []
    @Response    = Robot.Response
    @listeners   = []
    @loadPaths   = []
    @enableSlash = false
    @logger      = new Log process.env.HUBOT_LOG_LEVEL or "info"

    @parseVersion()
    @setupConnect() if httpd
    @loadAdapter adapterPath, adapter if adapter?

  # Public: Specify a router and callback to register as Connect middleware.
  #
  # route    - A String of the route to match.
  # callback - A Function that is called when the route is requested
  #
  # Returns nothing.
  route: (route, callback) ->
    @router.get route, callback

  # Public: Adds a Listener that attempts to match incoming messages based on
  # a Regex.
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  hear: (regex, callback) ->
    @listeners.push new TextListener(@, regex, callback)

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
      @logger.warning "Anchors don't work well with respond, perhaps you want to use 'hear'"
      @logger.warning "The regex in question was #{regex.toString()}"

    pattern = re.join("/") # combine the pattern back again

    if @alias
      alias = @alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") # escape alias for regexp
      newRegex = new RegExp("^(?:#{alias}[:,]?|#{@name}[:,]?)\\s*(?:#{pattern})", modifiers)
    else
      newRegex = new RegExp("^#{@name}[:,]?\\s*(?:#{pattern})", modifiers)

    @logger.debug newRegex.toString()
    @listeners.push new TextListener(@, newRegex, callback)

  # Public: Adds a Listener that triggers when anyone enters the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  enter: (callback) ->
    @listeners.push new Listener(@, ((msg) -> msg instanceof Robot.EnterMessage), callback)

  # Public: Adds a Listener that triggers when anyone leaves the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  leave: (callback) ->
    @listeners.push new Listener(@, ((msg) -> msg instanceof Robot.LeaveMessage), callback)

  # Public: Passes the given message to any interested Listeners.
  #
  # message - A Robot.Message instance. Listeners can flag this message as
  #  'done' to prevent further execution
  #
  # Returns nothing.
  receive: (message) ->
    for listener in @listeners
      try
        listener.call message
        break if message.done
      catch ex
        @logger.error "Unable to call the listener: #{ex}"


  # Public: Loads every script in the given path.
  #
  # path - A String path on the filesystem.
  #
  # Returns nothing.
  load: (path) ->
    @logger.info "Loading scripts from #{path}"

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
      try
        require(full) @
        @parseHelp "#{path}/#{file}"
      catch err
        @logger.error "#{err}"

  loadHubotScripts: (path, scripts) ->
    @logger.info "Loading hubot-scripts from #{path}"
    for script in scripts
      @loadFile path, script

  # Setup the Connect server's defaults
  #
  # Sets up basic authentication if parameters are provided
  #
  # Returns: nothing.
  setupConnect: ->
    user = process.env.CONNECT_USER
    pass = process.env.CONNECT_PASSWORD

    @connect = Connect()

    if user and pass
      @connect.use Connect.basicAuth(user, path)

    @connect.use Connect.bodyParser()
    @connect.use Connect.router (app) =>

      @router =
        get: (route, callback) =>
          @logger.debug "Registered route: GET #{route}"
          app.get route, callback

        post: (route, callback) =>
          @logger.debug "Registered route: POST #{route}"
          app.post route, callback

        put: (route, callback) =>
          @logger.debug "Registered route: PUT #{route}"
          app.put route, callback

        delete: (route, callback) =>
          @logger.debug "Registered route: DELETE #{route}"
          app.delete route, callback

    @connect.listen process.env.PORT || 8080

  # Load the adapter Hubot is going to use.
  #
  # path    - A String of the path to adapter if local.
  # adapter - A String of the adapter name to use.
  #
  # Returns nothing.
  loadAdapter: (path, adapter) ->
    @logger.debug "Loading adapter #{adapter}"

    try
      path = if adapter in HUBOT_DEFAULT_ADAPTERS
        "#{path}/#{adapter}"
      else
        "hubot-#{adapter}"

      @adapter = require("#{path}").use(@)
    catch err
      @logger.error "Cannot load adapter #{adapter} - #{err}"

  # Public: Help Commands for Running Scripts
  #
  # Returns an array of help commands for running scripts
  helpCommands: ->
    @commands.sort()

  # Private: load help info from a loaded script
  #
  # path - The path to the file on disk
  #
  # Returns nothing
  parseHelp: (path) ->
    Fs.readFile path, "utf-8", (err, body) =>
      throw err if err?
      for i, line of body.split("\n")
        break    if !(line[0] == '#' or line.substr(0, 2) == '//')
        continue if !line.match('-')
        @commands.push line[2..line.length]

  # Public: A helper send function which delegates to the adapter's send
  # function.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  send: (user, strings...) ->
    @adapter.send user, strings...

  # Public: A helper send function to message a room that the robot is in
  #
  # room    - String designating the room to message
  # strings - One or more Strings for each message to send.
  messageRoom: (room, strings...) ->
    user = @userForId @id, { room: room }
    @adapter.send user, strings...


  # Public: A helper reply function which delegates to the adapter's reply
  # function.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  reply: (user, strings...) ->
    @adapter.reply user, strings...

  # Public: Get an Array of User objects stored in the brain.
  users: ->
    @brain.data.users

  # Public: Get a User object given a unique identifier.
  userForId: (id, options) ->
    user = @brain.data.users[id]
    unless user
      user = new User id, options
      @brain.data.users[id] = user
    user

  # Public: Get a User object given a name.
  userForName: (name) ->
    result = null
    lowerName = name.toLowerCase()
    for k of (@brain.data.users or { })
      userName = @brain.data.users[k]['name']
      if userName? and userName.toLowerCase() is lowerName
        result = @brain.data.users[k]
    result

  # Public: Get all users whose names match fuzzyName. Currently, match
  # means 'starts with', but this could be extended to match initials,
  # nicknames, etc.
  #
  usersForRawFuzzyName: (fuzzyName) ->
    lowerFuzzyName = fuzzyName.toLowerCase()
    user for key, user of (@brain.data.users or {}) when (
      user.name.toLowerCase().lastIndexOf(lowerFuzzyName, 0) == 0)

  # Public: If fuzzyName is an exact match for a user, returns an array with
  # just that user. Otherwise, returns an array of all users for which
  # fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
  #
  usersForFuzzyName: (fuzzyName) ->
    matchedUsers = @usersForRawFuzzyName(fuzzyName)
    lowerFuzzyName = fuzzyName.toLowerCase()
    # We can scan matchedUsers rather than all users since usersForRawFuzzyName
    # will include exact matches
    for user in matchedUsers
      return [user] if user.name.toLowerCase() is lowerFuzzyName

    matchedUsers

  # Kick off the event loop for the adapter
  #
  # Returns: Nothing.
  run: ->
    @adapter.run()

  # Public: Gracefully shutdown the robot process
  #
  # Returns: Nothing.
  shutdown: ->
    @adapter.close()
    @brain.close()

  # Public: The version of Hubot from npm
  #
  # Returns: SemVer compliant version number
  parseVersion: ->
    package_path = __dirname + "/../package.json"

    data = Fs.readFileSync package_path, 'utf8'

    content = JSON.parse data
    @version = content.version

class Robot.Message
  # Represents an incoming message from the chat.
  #
  # user - A User instance that sent the message.
  constructor: (@user, @done = false) ->

  # Indicates that no other Listener should be called on this object
  finish: ->
    @done = true

class Robot.TextMessage extends Robot.Message
  # Represents an incoming message from the chat.
  #
  # user - A User instance that sent the message.
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
# user - A User instance for the user who entered.
class Robot.EnterMessage extends Robot.Message

# Represents an incoming user exit notification.
#
# user - A User instance for the user who left.
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
    @robot.adapter.send @message.user, strings...

  # Public: Posts a topic changing message
  #
  # strings - One or more strings to set as the topic of the
  #           room the bot is in.
  #
  # Returns nothing.
  topic: (strings...) ->
    @robot.adapter.topic @message.user, strings...

  # Public: Posts a message mentioning the current user.
  #
  # strings - One or more strings to be posted.  The order of these strings
  #           should be kept intact.
  #
  # Returns nothing.
  reply: (strings...) ->
    @robot.adapter.reply @message.user, strings...

  # Public: Picks a random item from the given items.
  #
  # items - An Array of items (usually Strings).
  #
  # Returns an random item.
  random: (items) ->
    items[ Math.floor(Math.random() * items.length) ]

  # Public: Tell the message to stop dispatching to listeners
  #
  # Returns nothing.
  finish: ->
    @message.finish()

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

HttpClient = require 'scoped-http-client'

Robot.Response::httpClient = HttpClient

module.exports = Robot

