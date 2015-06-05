Fs             = require 'fs'
Log            = require 'log'
Path           = require 'path'
HttpClient     = require 'scoped-http-client'
{EventEmitter} = require 'events'

User = require './user'
Brain = require './brain'
Response = require './response'
{Listener,TextListener} = require './listener'
{EnterMessage,LeaveMessage,TopicMessage,CatchAllMessage} = require './message'
{Hook} = require './hook'

HUBOT_DEFAULT_ADAPTERS = [
  'campfire'
  'shell'
]

HUBOT_DOCUMENTATION_SECTIONS = [
  'description'
  'dependencies'
  'configuration'
  'commands'
  'notes'
  'author'
  'authors'
  'examples'
  'tags'
  'urls'
]

class Robot
  # Robots receive messages from a chat source (Campfire, irc, etc), and
  # dispatch them to matching listeners.
  #
  # adapterPath - A String of the path to local adapters.
  # adapter     - A String of the adapter name.
  # httpd       - A Boolean whether to enable the HTTP daemon.
  # name        - A String of the robot name, defaults to Hubot.
  #
  # Returns nothing.
  constructor: (adapterPath, adapter, httpd, name = 'Hubot') ->
    @name      = name
    @events    = new EventEmitter
    @brain     = new Brain @
    @alias     = false
    @adapter   = null
    @Response  = Response
    @commands  = []
    @listeners = []
    @logger    = new Log process.env.HUBOT_LOG_LEVEL or 'info'
    @pingIntervalId = null
    @hooks     = {}
    @globalHttpOptions = {}


    @parseVersion()
    if httpd
      @setupExpress()
    else
      @setupNullRouter()

    @loadAdapter adapterPath, adapter

    @adapterName   = adapter
    @errorHandlers = []

    @on 'error', (err, res) =>
      @invokeErrorHandlers(err, res)
    @onUncaughtException = (err) =>
      @emit 'error', err
    process.on 'uncaughtException', @onUncaughtException

  # Public: Adds a Listener that attempts to match incoming messages based on
  # a Regex.
  #
  # regex    - A Regex that determines if the callback should be called.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  hear: (regex, options, callback) ->
    @listeners.push new TextListener(@, regex, options, callback)

  # Public: Adds a Listener that attempts to match incoming messages directed
  # at the robot based on a Regex. All regexes treat patterns like they begin
  # with a '^'
  #
  # regex    - A Regex that determines if the callback should be called.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  respond: (regex, options, callback) ->
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
        "^\\s*[@]?(?:#{alias}[:,]?|#{name}[:,]?)\\s*(?:#{pattern})"
        modifiers
      )
    else
      newRegex = new RegExp(
        "^\\s*[@]?#{name}[:,]?\\s*(?:#{pattern})",
        modifiers
      )

    @listeners.push new TextListener(@, newRegex, options, callback)

  # Public: Adds a Listener that triggers when anyone enters the room.
  #
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  enter: (options, callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof EnterMessage),
      options,
      callback
    )

  # Public: Adds a Listener that triggers when anyone leaves the room.
  #
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  leave: (options, callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof LeaveMessage),
      options,
      callback
    )

  # Public: Adds a Listener that triggers when anyone changes the topic.
  #
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  topic: (options, callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof TopicMessage),
      options,
      callback
    )

  # Public: Adds an error handler when an uncaught exception or user emitted
  # error event occurs.
  #
  # callback - A Function that is called with the error object.
  #
  # Returns nothing.
  error: (callback) ->
    @errorHandlers.push callback

  # Calls and passes any registered error handlers for unhandled exceptions or
  # user emitted error events.
  #
  # err - An Error object.
  # res - An optional Response object that generated the error
  #
  # Returns nothing.
  invokeErrorHandlers: (err, res) ->
    @logger.error err.stack
    for errorHandler in @errorHandlers
     try
       errorHandler(err, res)
     catch errErr
       @logger.error "while invoking error handler: #{errErr}\n#{errErr.stack}"

  # Public: Adds a Listener that triggers when no other text matchers match.
  #
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  catchAll: (options, callback) ->
    # `options` is optional; need to isolate the real callback before
    # wrapping it with logic below
    if not callback?
      callback = options
      options = {}

    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof CatchAllMessage),
      options,
      ((msg) -> msg.message = msg.message.message; callback msg)
    )

  # Public: Passes the given message to any interested Listeners.
  #
  # message - A Message instance. Listeners can flag this message as 'done' to
  #           prevent further execution.
  #
  # Returns nothing.
  receive: (message) ->
    curriedReceive = =>
      @receiveWithoutHooks(message)
    @runHooks 'prereceive', curriedReceive, message

  # Private: receive a message, passing it to any inerested listeners. Does
  # not execute callbacks.
  #
  # message - A Message instance
  #
  # Returns nothing.
  receiveWithoutHooks: (message) ->
    results = []
    for listener in @listeners
      try
        break if message.done
        results.push listener.call(message)
      catch error
        @emit('error', error, new @Response(@, message, []))

        false

    if message not instanceof CatchAllMessage and results.indexOf(true) is -1
      @receiveWithoutHooks new CatchAllMessage(message)

  # Public: Loads a file in path.
  #
  # path - A String path on the filesystem.
  # file - A String filename in path on the filesystem.
  #
  # Returns nothing.
  loadFile: (path, file) ->
    ext  = Path.extname file
    full = Path.join path, Path.basename(file, ext)
    if require.extensions[ext]
      try
        script = require(full)

        if typeof script is 'function'
          script @
          @parseHelp Path.join(path, file)
        else
          @logger.warning "Expected #{full} to assign a function to module.exports, got #{typeof script}"

      catch error
        @logger.error "Unable to load #{full}: #{error.stack}"
        process.exit(1)

  # Public: Loads every script in the given path.
  #
  # path - A String path on the filesystem.
  #
  # Returns nothing.
  load: (path) ->
    @logger.debug "Loading scripts from #{path}"

    if Fs.existsSync(path)
      for file in Fs.readdirSync(path).sort()
        @loadFile path, file

  # Public: Load scripts specfied in the `hubot-scripts.json` file.
  #
  # path    - A String path to the hubot-scripts files.
  # scripts - An Array of scripts to load.
  #
  # Returns nothing.
  loadHubotScripts: (path, scripts) ->
    @logger.debug "Loading hubot-scripts from #{path}"
    for script in scripts
      @loadFile path, script

  # Public: Load scripts from packages specfied in the
  # `external-scripts.json` file.
  #
  # packages - An Array of packages containing hubot scripts to load.
  #
  # Returns nothing.
  loadExternalScripts: (packages) ->
    @logger.debug "Loading external-scripts from npm packages"
    try
      if packages instanceof Array
        for pkg in packages
          require(pkg)(@)
      else
        for pkg, scripts of packages
          require(pkg)(@, scripts)
    catch err
      @logger.error "Error loading scripts from npm package - #{err.stack}"
      process.exit(1)

  # Setup the Express server's defaults.
  #
  # Returns nothing.
  setupExpress: ->
    user    = process.env.EXPRESS_USER
    pass    = process.env.EXPRESS_PASSWORD
    stat    = process.env.EXPRESS_STATIC
    port    = process.env.EXPRESS_PORT or process.env.PORT or 8080
    address = process.env.EXPRESS_BIND_ADDRESS or process.env.BIND_ADDRESS or '0.0.0.0'

    express = require 'express'
    multipart = require 'connect-multiparty'

    app = express()

    app.use (req, res, next) =>
      res.setHeader "X-Powered-By", "hubot/#{@name}"
      next()

    app.use express.basicAuth user, pass if user and pass
    app.use express.query()

    app.use express.json()
    app.use express.urlencoded()
    # replacement for deprecated express.multipart/connect.multipart
    # limit to 100mb, as per the old behavior
    app.use multipart(maxFilesSize: 100 * 1024 * 1024)

    app.use express.static stat if stat

    try
      @server = app.listen(port, address)
      @router = app
    catch err
      @logger.error "Error trying to start HTTP server: #{err}\n#{err.stack}"
      process.exit(1)

    herokuUrl = process.env.HEROKU_URL

    if herokuUrl
      herokuUrl += '/' unless /\/$/.test herokuUrl
      @pingIntervalId = setInterval =>
        HttpClient.create("#{herokuUrl}hubot/ping").post() (err, res, body) =>
          @logger.info 'keep alive ping!'
      , 5 * 60 * 1000

  # Setup an empty router object
  #
  # returns nothing
  setupNullRouter: ->
    msg = "A script has tried registering a HTTP route while the HTTP server is disabled with --disabled-httpd."
    @router =
      get: ()=> @logger.warning msg
      post: ()=> @logger.warning msg
      put: ()=> @logger.warning msg
      delete: ()=> @logger.warning msg


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

      @adapter = require(path).use @
    catch err
      @logger.error "Cannot load adapter #{adapter} - #{err}"
      process.exit(1)

  # Public: Help Commands for Running Scripts.
  #
  # Returns an Array of help commands for running scripts.
  helpCommands: ->
    @commands.sort()

  # Private: load help info from a loaded script.
  #
  # path - A String path to the file on disk.
  #
  # Returns nothing.
  parseHelp: (path) ->
    @logger.debug "Parsing help for #{path}"
    scriptName = Path.basename(path).replace /\.(coffee|js)$/, ''
    scriptDocumentation = {}

    body = Fs.readFileSync path, 'utf-8'

    currentSection = null
    for line in body.split "\n"
      break unless line[0] is '#' or line.substr(0, 2) is '//'

      cleanedLine = line.replace(/^(#|\/\/)\s?/, "").trim()

      continue if cleanedLine.length is 0
      continue if cleanedLine.toLowerCase() is 'none'

      nextSection = cleanedLine.toLowerCase().replace(':', '')
      if nextSection in HUBOT_DOCUMENTATION_SECTIONS
        currentSection = nextSection
        scriptDocumentation[currentSection] = []
      else
        if currentSection
          scriptDocumentation[currentSection].push cleanedLine.trim()
          if currentSection is 'commands'
            @commands.push cleanedLine.trim()

    if currentSection is null
      @logger.info "#{path} is using deprecated documentation syntax"
      scriptDocumentation.commands = []
      for line in body.split("\n")
        break    if not (line[0] is '#' or line.substr(0, 2) is '//')
        continue if not line.match('-')
        cleanedLine = line[2..line.length].replace(/^hubot/i, @name).trim()
        scriptDocumentation.commands.push cleanedLine
        @commands.push cleanedLine

  # Public: A helper send function to message a room that the robot is in.
  #
  # room    - String designating the room to message.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  messageRoom: (room, strings...) ->
    user = { room: room }
    @adapter.send user, strings...

  # Public: A wrapper around the EventEmitter API to make usage
  # semanticly better.
  #
  # event    - The event name.
  # listener - A Function that is called with the event parameter
  #            when event happens.
  #
  # Returns nothing.
  on: (event, args...) ->
    @events.on event, args...

  # Public: A wrapper around the EventEmitter API to make usage
  # semanticly better.
  #
  # event   - The event name.
  # args...  - Arguments emitted by the event
  #
  # Returns nothing.
  emit: (event, args...) ->
    @events.emit event, args...

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
    process.removeListener 'uncaughtException', @onUncaughtException
    @adapter.close()
    @brain.close()

  # Public: The version of Hubot from npm
  #
  # Returns a String of the version number.
  parseVersion: ->
    pkg = require Path.join __dirname, '..', 'package.json'
    @version = pkg.version

  # Public: Creates a scoped http client with chainable methods for
  # modifying the request. This doesn't actually make a request though.
  # Once your request is assembled, you can call `get()`/`post()`/etc to
  # send the request.
  #
  # url - String URL to access.
  # options - Optional options to pass on to the client
  #
  # Examples:
  #
  #     robot.http("http://example.com")
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
  #    # Can also set options
  #    robot.http("https://example.com", {rejectUnauthorized: false})
  #
  # Returns a ScopedClient instance.
  http: (url, options) ->
    HttpClient.create(url, @extend({}, @globalHttpOptions, options))
      .header('User-Agent', "Hubot/#{@version}")

  # Public. Adds a prereceive callback hook to this robot.
  #
  #   cb  - A callback function which accepts a Hook object.
  #
  # See also Hook
  # Returns nothing
  prereceive: (cb) ->
    @hooks['prereceive'] ||= []
    @hooks['prereceive'].push cb

  # Public. Adds a prelisten callback hook to this robot.
  #
  #   cb  - A callback function which accepts a Hook object.
  #
  # See also Hook
  # Returns nothing
  prelisten: (cb) ->
    @hooks['prelisten'] ||= []
    @hooks['prelisten'].push cb

  # Protected. For use by Listener to run prelisten callbacks after a match
  # is found.
  #
  # See also Hook
  # Returns nothing
  runPrelistenHooks: (listener, response) ->
    done = ->
      listener.callback(response) unless response.envelope.message.done
    @runHooks 'prelisten', done, response.envelope.message, response, listener

  # Public. Adds a prereply callback hook to this robot.
  #
  #   cb  - A callback function which accepts a Hook object.
  #
  # See also Hook
  # Returns nothing
  prereply: (cb) ->
    @hooks['prereply'] ||= []
    @hooks['prereply'].push cb

  # Protected. For use by Response to run hooks before replying.
  #
  # TODO: we should have a listener available here, but there's no way to get
  # to it. Responses belong to listeners but don't have a way to get to them,
  # and we should change that API.
  runPrereplyHooks: (response, string, cb) ->
    @runHooks 'prereply', cb, response.envelope.message, response, response.listener, { text: string }

  # Private. Run the hooks of a given name
  #
  #  name     - 'prereceive'
  #  response - The response object
  #  listener - The matching listener, if any
  #  message  - A message that hubot is trying to send, if any
  #
  # Each hook must call hook.next() or hook.done(). Hook.next() continues
  # processing and hook.done() aborts the message. If a response message
  # exists, hook.done() prevents it from being sent.
  #
  # Returns nothing.
  runHooks: (name, callback, message, response, listener, reply) ->
    hooks = @hooks[name]
    if hooks?.length > 0
      opts =
        hooks:    hooks
        callback: callback
        response: response
        message:  message
        listener: listener
        robot:    this
        reply:    reply
      hook = new Hook(opts)
      hook.run()
    else
      callback()

  # Private: Extend obj with objects passed as additional args.
  #
  # Returns the original object with updated changes.
  extend: (obj, sources...) ->
    for source in sources
      obj[key] = value for own key, value of source
    obj

module.exports = Robot
