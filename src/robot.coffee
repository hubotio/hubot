Fs           = require 'fs'
Log          = require 'log'
Path         = require 'path'
HttpClient   = require 'scoped-http-client'
EventEmitter = require('events').EventEmitter;

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
  constructor: (adapterPath, adapter, httpd, name = 'Hubot') ->
    @name         = name
    @brain        = new Brain
    @events       = new EventEmitter
    @alias        = false
    @adapter      = null
    @Response     = Response
    @commands     = []
    @listeners    = []
    @logger       = new Log process.env.HUBOT_LOG_LEVEL or 'info'

    @parseVersion()
    @setupConnect() if httpd
    @loadAdapter adapterPath, adapter if adapter?

  hear: (regex, callback) ->
    @listeners.push new TextListener(@, regex, callback)

  respond: (regex, callback) ->
    re = regex.toString().split('/')
    re.shift()           # remove empty first item
    modifiers = re.pop() # pop off modifiers

    if re[0] and re[0][0] is '^'
      @logger.warning "Anchors don't work well with respond, perhaps you want to use 'hear'"
      @logger.warning "The regex in question was #{regex.toString()}"

    pattern = re.join('/') # combine the pattern back again

    if @alias
      alias = @alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      newRegex = new RegExp(
        "^[@]?(?:#{alias}[:,]?|#{@name}[:,]?)\\s*(?:#{pattern})",
        modifiers
      )
    else
      newRegex = new RegExp(
        "^[@]?#{@name}[:,]?\\s*(?:#{pattern})",
        modifiers
      )

    @listeners.push new TextListener(@, newRegex, callback)

  enter: (callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof EnterMessage),
      callback
    )

  leave: (callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof LeaveMessage),
      callback
    )

  topic: (callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof TopicMessage),
      callback
    )

  catchAll: (callback) ->
    @listeners.push new Listener(
      @,
      ((msg) -> msg instanceof CatchAllMessage),
      ((msg) -> msg.message = msg.message.message; callback msg)
    )

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

  load: (path) ->
    @logger.debug "Loading scripts from #{path}"
    Fs.exists path, (exists) =>
      if exists
        for file in Fs.readdirSync(path)
          @loadFile path, file

  loadHubotScripts: (path, scripts) ->
    @logger.debug "Loading hubot-scripts from #{path}"
    for script in scripts
      @loadFile path, script

  loadExternalScripts: (packages) ->
    @logger.debug "Loading external-scripts from npm packages"
    for pkg in packages
      try
        require(pkg) @
      catch error
        @logger.error "Error loading scripts from npm package - #{error}"
        process.exit(1)

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

  helpCommands: ->
    @commands.sort()

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

  send: (user, strings...) ->
    @adapter.send user, strings...

  reply: (user, strings...) ->
    @adapter.reply user, strings...

  messageRoom: (room, strings...) ->
    user = { room: room }
    @adapter.send user, strings...

  on: (event, args...) ->
    @events.on event, args...

  emit: (event, args...) ->
    @events.emit event, args...

  run: ->
    @adapter.run()

  shutdown: ->
    @adapter.close()
    @brain.close()

  parseVersion: ->
    package_path = Path.join __dirname, '..', 'package.json'
    data = Fs.readFileSync package_path, 'utf8'
    @version = JSON.parse(data).version

  http: (url) ->
    HttpClient.create(url)

module.exports = Robot
