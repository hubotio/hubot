Fs             = require 'fs'
Log            = require 'log'
Path           = require 'path'
HttpClient     = require 'scoped-http-client'
{EventEmitter} = require 'events'

User                                        = require './user'
Brain                                       = require './brain'
Response                                    = require './response'
{Listener,TextListener}                     = require './listener'
{EnterMessage,LeaveMessage,CatchAllMessage} = require './message'

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
  'examples'
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
  #
  # TODO: reduce the amount of parameters?
  constructor: (adapterPath, adapter, httpd, name = 'Hubot') ->
    @name      = name
    @brain     = new Brain
    @events    = new EventEmitter
    @alias     = false
    @adapter   = null
    @Response  = Response
    @commands  = []
    @listeners = []
    @logger    = new Log process.env.HUBOT_LOG_LEVEL or 'info'

    @parseVersion()
    @setupExpress() if httpd
    @loadAdapter adapterPath, adapter

  # Public: Adds a Listener that attempts to match incoming messages based on
  # a Regex.
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  #
  # TODO: update to work with the new script format and backcompat
  hear: (regex, callback) ->
    @listeners.push new TextListener(@, regex, callback)

  # Public: Adds a Listener that attempts to match incoming messages directed
  # at the robot based on a Regex. All regexes treat patterns like they begin
  # with a '^'
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  #
  # TODO: update to work with the new script format, and backcompat
  respond: (regex, callback) ->
    re = regex.toString().split('/')
    re.shift()
    modifiers = re.pop()

    if re[0] and re[0][0] is '^'
      @logger.warning \
        "Anchors don't work well with respond, perhaps you want to use 'hear'"
      @logger.warning "The regex in question was #{regex.toString()}"

    pattern = re.join('/')

    if @alias
      alias = @alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      newRegex = new RegExp(
        "^[@]?(?:#{alias}[:,]?|#{@name}[:,]?)\\s*(?:#{pattern})"
        modifiers
      )
    else
      newRegex = new RegExp(
        "^[@]?#{@name}[:,]?\\s*(?:#{pattern})",
        modifiers
      )

    @listeners.push new TextListener(@, newRegex, callback)

  # Public: Adds a Listener that triggers when anyone enters the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  enter: (callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof EnterMessage),
      callback
    )

  # Public: Adds a Listener that triggers when anyone leaves the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  leave: (callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof LeaveMessage),
      callback
    )

  # Public: Adds a Listener that triggers when anyone changes the topic.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  topic: (callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof TopicMessage),
      callback
    )

  # Public: Adds a Listener that triggers when no other text matchers match.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  #
  # TODO: not really a fan of this, remove or keep?
  catchAll: (callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof CatchAllMessage),
      ((msg) -> msg.message = msg.message.message; callback msg)
    )

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
    if message not instanceof CatchAllMessage and results.indexOf(true) is -1
      @receive new CatchAllMessage(message)

  # Public: Loads a file in path.
  #
  # path - A String path on the filesystem.
  # file - A String filename in path on the filesystem.
  #
  # Returns nothing.
  #
  # TODO: consider finding a way to simplify file loading
  loadFile: (path, file) ->
    ext  = Path.extname file
    full = Path.join path, Path.basename(file, ext)
    if ext is '.coffee' or ext is '.js'
      try
        require(full) @
        @parseHelp "#{path}/#{file}"
      catch error
        @logger.error "Unable to load #{full}: #{error.stack}"
        process.exit(1)

  # Public: Loads every script in the given path.
  #
  # path - A String path on the filesystem.
  #
  # Returns nothing.
  #
  # TODO: consider finding a way to simplify file loading
  load: (path) ->
    @logger.debug "Loading scripts from #{path}"
    Fs.exists path, (exists) =>
      if exists
        for file in Fs.readdirSync(path)
          @loadFile path, file

  # Public: Load scripts specfied in the `hubot-scripts.json` file.
  #
  # path    - A String path to the hubot-scripts files.
  # scripts - An Array of scripts to load.
  #
  # Returns nothing.
  #
  # TODO: consider finding a way to simplify file loading
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
  #
  # TODO: consider finding a way to simplify file loading
  loadExternalScripts: (packages) ->
    @logger.debug "Loading external-scripts from npm packages"
    for pkg in packages
      try
        require(pkg) @
      catch error
        @logger.error "Error loading scripts from npm package - #{error}"
        process.exit(1)

  # Setup the Express server's defaults.
  #
  # Returns nothing.
  #
  # TODO: maybe move the entire connect part into a third-party package?
  setupExpress: ->
    # Load config.
    user    = process.env.EXPRESS_USER
    pass    = process.env.EXPRESS_PASSWORD

    stat    = process.env.EXPRESS_STATIC
    sockets = process.env.EXPRESS_SOCKETS

    # Require express.
    express = require 'express'

    # Initialize server and middleware.
    app = express()

    app.use express.basicAuth user, pass if user and pass
    app.use express.query()
    app.use express.bodyParser()
    app.use express.static stat if stat

    # Listen to incoming requests.
    @server = app.listen process.env.PORT || 8080

    # Expose express app as router.
    @router = app

    herokuUrl = process.env.HEROKU_URL

    if herokuUrl
      herokuUrl += '/' unless /\/$/.test herokuUrl
      setInterval =>
        HttpClient.create("#{herokuUrl}hubot/ping").post() (err, res, body) =>
          @logger.info 'keep alive ping!'
      , 1200000

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
  #
  # TODO: maybe remove this method and just have scripts use @commands
  helpCommands: ->
    @commands.sort()

  # Private: load help info from a loaded script.
  #
  # path - A String path to the file on disk.
  #
  # Returns nothing.
  #
  # TODO: update to use new script format and backcompat
  parseHelp: (path) ->
    @logger.debug "Parsing help for #{path}"
    scriptName = Path.basename(path).replace /\.(coffee|js)$/, ''
    scriptDocumentation = {}

    Fs.readFile path, 'utf-8', (err, body) =>
      throw err if err?

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

  # Public: A helper send function which delegates to the adapter's send
  # function.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  #
  # TODO: update as may clash with new script format
  send: (user, strings...) ->
    @adapter.send user, strings...

  # Public: A helper reply function which delegates to the adapter's reply
  # function.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  #
  # TODO: update as may clash with new script format
  reply: (user, strings...) ->
    @adapter.reply user, strings...

  # Public: A helper send function to message a room that the robot is in.
  #
  # room    - String designating the room to message.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  #
  # TODO: maybe be redundant depending on new script format functions
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
    @adapter.run()

  # Public: Gracefully shutdown the robot process
  #
  # Returns nothing.
  shutdown: ->
    @adapter.close()
    @brain.close()

  # Public: The version of Hubot from npm
  #
  # Returns a String of the version number.
  parseVersion: ->
    package_path = Path.join __dirname, '..', 'package.json'
    data = Fs.readFileSync package_path, 'utf8'
    content = JSON.parse data
    @version = content.version

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
  # Returns a ScopedClient instance.
  http: (url) ->
    HttpClient.create(url)

module.exports = Robot
