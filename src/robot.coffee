Fs         = require 'fs'
Log        = require 'log'
Path       = require 'path'
HttpClient = require 'scoped-http-client'

User                                                    = require './user'
Brain                                                   = require './brain'
Response                                                = require './response'
{Listener,TextListener}                                 = require './listener'
{TextMessage,EnterMessage,LeaveMessage,CatchAllMessage} = require './message'

HUBOT_DEFAULT_ADAPTERS = [
  'campfire',
  'shell'
]

HUBOT_DOCUMENTATION_SECTIONS = [
  'description',
  'dependencies',
  'configuration',
  'commands',
  'notes',
  'author',
  'examples',
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
  constructor: (adapterPath, adapter, httpd, name = 'Hubot') ->
    @name         = name
    @brain        = new Brain
    @alias        = false
    @adapter      = null
    @Response     = Response
    @commands     = []
    @listeners    = []
    @logger       = new Log process.env.HUBOT_LOG_LEVEL or 'info'

    @parseVersion()
    @setupConnect() if httpd
    @loadAdapter adapterPath, adapter if adapter?

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
  # at the robot based on a Regex. All regexes treat patterns like they begin
  # with a '^'
  #
  # regex    - A Regex that determines if the callback should be called.
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  respond: (regex, callback) ->
    re = regex.toString().split('/')
    re.shift()           # remove empty first item
    modifiers = re.pop() # pop off modifiers

    if re[0] and re[0][0] is '^'
      @logger.warning "Anchors don't work well with respond, perhaps you want to use 'hear'"
      @logger.warning "The regex in question was #{regex.toString()}"

    pattern = re.join('/') # combine the pattern back again

    if @alias
      alias = @alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') # escape alias for regexp
      newRegex = new RegExp("^(?:#{alias}[:,]?|#{@name}[:,]?)\\s*(?:#{pattern})", modifiers)
    else
      newRegex = new RegExp("^#{@name}[:,]?\\s*(?:#{pattern})", modifiers)

    @listeners.push new TextListener(@, newRegex, callback)

  # Public: Adds a Listener that triggers when anyone enters the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  enter: (callback) ->
    @listeners.push new Listener(@, ((msg) -> msg instanceof EnterMessage), callback)

  # Public: Adds a Listener that triggers when anyone leaves the room.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  leave: (callback) ->
    @listeners.push new Listener(@, ((msg) -> msg instanceof LeaveMessage), callback)

  # Public: Adds a Listener that triggers when no other text matchers match.
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  catchAll: (callback) ->
    @listeners.push new Listener(@, ((msg) -> msg instanceof CatchAllMessage), ((msg) -> msg.message = msg.message.message; callback msg))

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
  loadFile: (path, file) ->
    ext  = Path.extname file
    full = Path.join path, Path.basename(file, ext)
    if ext is '.coffee' or ext is '.js'
      try
        require(full) @
        @parseHelp "#{path}/#{file}"
      catch error
        @logger.error "Unable to load #{full}: #{error}\n#{error.stack}"

  # Public: Loads every script in the given path.
  #
  # path - A String path on the filesystem.
  #
  # Returns nothing.
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
    for pkg in packages
      try
        require(pkg) @
      catch error
        @logger.error "Error loading scripts from npm package - #{error}"

  # Setup the Connect server's defaults.
  #
  # Returns nothing.
  setupConnect: ->
    user = process.env.CONNECT_USER
    pass = process.env.CONNECT_PASSWORD
    stat = process.env.CONNECT_STATIC

    Connect        = require 'connect'
    Connect.router = require 'connect_router'

    @connect = Connect()

    @connect.use Connect.basicAuth(user, pass) if user and pass
    @connect.use Connect.bodyParser()
    @connect.use Connect.static(stat) if stat
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

    @server = @connect.listen process.env.PORT || 8080

    herokuUrl = process.env.HEROKU_URL

    if herokuUrl
      herokuUrl += '/' unless /\/$/.test herokuUrl
      setInterval =>
        HttpClient.create("#{herokuUrl}hubot/ping")
          .post() (err, res, body) =>
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
