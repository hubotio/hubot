Fs = require 'fs'
Log = require 'log'
Path = require 'path'
HttpClient = require 'scoped-http-client'
{EventEmitter} = require 'events'

User = require './user'
Brain = require './brain'
Scripts = require './scripts'
Adapter = require './adapter'
Response  = require './response'
Listener = require './listener'
Message = require './message'

class Robot extends EventEmitter
  # Robots receive messages from a chat source (Campfire, irc, etc), and
  # dispatch them to matching listeners.
  #
  # args - An Object of arguments for creating a robot.
  constructor: (args) ->
    @logger = new Log process.env.HUBOT_LOG_LEVEL or 'info'

    @name = args.name or 'Hubot'
    @alias = args.alias
    @brain = new Brain @

    Adapter.load @, args.adapterPath, args.adapter

    @scripts = new Scripts @

    @Response = Response
    @listeners = []

    @parseVersion()
    @setupExpress() if args.httpd
    @pingIntervalId = null

    @errorHandlers = []

    @on 'error', @invokeErrorHandlers
    process.on 'uncaughtException', @invokeErrorhandlers


  # Public: Adds a Listener that attempts to match incoming messages based on
  # a Regex.
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  hear: (regex, callback) ->
    matcher = (msg) ->
      if msg.type is 'text' then msg.match regex
    @listeners.push new Listener(@, matcher, callback)

  # Public: Adds a Listener that attempts to match incoming messages directed
  # at the robot based on a Regex. All regexes treat patterns like they begin
  # with a '^'
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  respond: (regex, callback) ->
    re = regex.toString().split('/')
    re.shift()
    modifiers = re.pop()

    if re[0] and re[0][0] is '^'
      @logger.warning \
        "Anchors don't work well with respond, perhaps you want to use 'hear'"
      @logger.warning "The regex in question was #{regex.toString()}"

    pattern = re.join('/')
    name = @name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

    if @alias
      alias = @alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      newRegex = new RegExp(
        "^[@]?(?:#{alias}[:,]?|#{name}[:,]?)\\s*(?:#{pattern})"
        modifiers
      )
    else
      newRegex = new RegExp(
        "^[@]?#{name}[:,]?\\s*(?:#{pattern})",
        modifiers
      )

    matcher = (msg) ->
      if msg.type is 'text' then msg.match newRegex
    @listeners.push new Listener(@, matcher, callback)

  # Public: Adds a Listener that triggers when anyone enters the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  enter: (callback) ->
    matcher = (msg) -> msg.type is 'enter'
    @listeners.push new Listener(@, matcher, callback)

  # Public: Adds a Listener that triggers when anyone leaves the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  leave: (callback) ->
    matcher = (msg) -> msg.type is 'leave'
    @listeners.push new Listener(@, matcher, callback)

  # Public: Adds a Listener that triggers when anyone changes the topic.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  topic: (callback) ->
    matcher = (msg) -> msg.type is 'topic'
    @listeners.push new Listener(@, matcher, callback)

  # Public: Adds an error handler when an uncaught exception or user emitted
  # error event occurs.
  #
  # callback - A Function that is called with the error object.
  #
  # Returns nothing.
  error: (callback) ->
    @errorHandlers.push callback

  # Private: Calls and passes any registered error handlers for unhandled
  # exceptions or user emitted error events.
  #
  # err - An Error object.
  #
  # Returns nothing.
  invokeErrorHandlers: (err) ->
    errorHandler err for errorHandler in @errorHandlers

  # Public: Passes the given message to any interested Listeners.
  #
  # message - A Message instance. Listeners can flag this message as 'done' to
  #           prevent further execution.
  #
  # Returns nothing.
  receive: (message) ->
    results = []
    for listener in @listeners
      try
        results.push listener.call(message)
        break if message.done
      catch error
        @logger.error "Unable to call the listener: #{error}\n#{error.stack}"
        false

  # Setup the Express server's defaults.
  #
  # Returns nothing.
  setupExpress: ->
    user = process.env.EXPRESS_USER
    pass = process.env.EXPRESS_PASSWORD
    stat = process.env.EXPRESS_STATIC

    express = require 'express'

    app = express()
    app.use express.basicAuth user, pass if user and pass
    app.use express.query()
    app.use express.bodyParser()
    app.use express.static stat if stat

    @server = app.listen process.env.PORT or 8080
    @router = app

    herokuUrl = process.env.HEROKU_URL

    if herokuUrl
      herokuUrl += '/' unless /\/$/.test herokuUrl
      @pingIntervalId = setInterval =>
        HttpClient.create("#{herokuUrl}hubot/ping").post() (err, res, body) =>
          @logger.info 'keep alive ping!'
      , 1200000

  # Public: A helper send function which delegates to the adapter's send
  # function.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  send: (user, strings...) ->
    @adapter.send user, strings...

  # Public: A helper reply function which delegates to the adapter's reply
  # function.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  reply: (user, strings...) ->
    @adapter.reply user, strings...

  # Public: A helper send function to message a room that the robot is in.
  #
  # room    - String designating the room to message.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  messageRoom: (room, strings...) ->
    user = { room: room }
    @adapter.send user, strings...

  # Public: Kick off the event loop for the adapter
  #
  # Returns nothing.
  run: ->
    @emit "running"
    @adapter.run()

  # Public: Gracefully shutdown the robot process
  #
  # Returns nothing.
  shutdown: ->
    clearInterval @pingIntervalId if @pingIntervalId?
    @adapter.close()
    @brain.close()

  # Public: The version of Hubot from npm
  #
  # Returns a String of the version number.
  parseVersion: ->
    package_path = Path.join __dirname, '..', 'package.json'
    pkg = require package_path
    @version = pkg.version

  # Public: Creates a scoped http client with chainable methods for
  # modifying the request. This doesn't actually make a request though.
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
  # Returns a ScopedClient.
  http: (url) ->
    HttpClient.create(url)
      .header('User-Agent', "Hubot/#{@version}")

  # Public: Get a sorted Array of hubot commands with descriptions. Dispatches to Scripts.
  #
  # Returns an Array of sorted hubot commands with descriptions.
  helpCommands: ->
    @logger.warning '@helpCommands() is going to be deprecated in 4.0.0, use @robot.scripts.helpCommands()'
    @scripts.helpCommands()

  # TODO would be nice to deprecate the object model, but not sure how that would work
  # maybe an overridden Array that rewrites all methods to throw warning?
  commands: "robot.commands has moved to robot.scripts.commands"

module.exports = Robot
