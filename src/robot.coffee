Fs             = require 'fs'
Path           = require 'path'

Basebot = require './basebot'

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

class Robot extends Basebot
  # Robot extends Basebot and provides autoloading of scripts and adapters for
  # ease of use.
  #
  # adapterPath -  A String of the path to built-in adapters (defaults to src/adapters)
  # adapterName     - A String of the adapter name.
  # httpd       - A Boolean whether to enable the HTTP daemon.
  # name        - A String of the robot name, defaults to Hubot.
  #
  # Returns nothing.
  constructor: (adapterPath, adapterName, httpd, name = 'Hubot', alias = false) ->
    @adapterPath ?= Path.join __dirname, "adapters"
    @adapterName = adapterName
    super name, alias

    adapter = @loadAdapterFile @adapterName
    @adapter = adapter.use @

    if httpd
      @setupExpress()

    @setupScopedHTTPClient()

    @parseVersion()

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

  # Public: Load scripts specified in the `hubot-scripts.json` file.
  #
  # path    - A String path to the hubot-scripts files.
  # scripts - An Array of scripts to load.
  #
  # Returns nothing.
  loadHubotScripts: (path, scripts) ->
    @logger.debug "Loading hubot-scripts from #{path}"
    for script in scripts
      @loadFile path, script

  # Public: Load scripts from packages specified in the
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

  # Load the adapter Hubot is going to use.
  #
  # path    - A String of the path to adapter if local.
  # adapter - A String of the adapter name to use.
  #
  # Returns nothing.
  loadAdapterFile: (adapter) ->
    @logger.debug "Loading adapter #{adapter}"

    try
      path = if adapter in HUBOT_DEFAULT_ADAPTERS
        "#{@adapterPath}/#{adapter}"
      else
        "hubot-#{adapter}"

      return require(path)
    catch err
      @logger.error "Cannot load adapter #{adapter} - #{err}"
      process.exit(1)

  # Setup the Express server's defaults.
  #
  # Returns nothing.
  setupExpress: ->
    router = require('./express') @
    @setupRouter router

  setupScopedHTTPClient: ->
    client = require('./scopedHTTPClient') @
    @setupHTTP client


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

  # Public: The version of Hubot from npm
  #
  # Returns a String of the version number.
  parseVersion: ->
    pkg = require Path.join __dirname, '..', 'package.json'
    @version = pkg.version

module.exports = Robot
