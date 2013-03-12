#!/usr/bin/env coffee
# vim:ft=coffee ts=2 sw=2 et :
# -*- mode:coffee -*-

Creator  = require '../src/creator'
Hubot    = require '..'

Fs       = require 'fs'
OptParse = require 'optparse'
Path     = require 'path'

Switches = [
  [ "-a", "--adapter ADAPTER", "The Adapter to use" ],
  [ "-c", "--create PATH",     "Create a deployable hubot" ],
  [ "-d", "--disable-httpd",   "Disable the HTTP server" ],
  [ "-h", "--help",            "Display the help information" ],
  [ "-l", "--alias ALIAS",     "Enable replacing the robot's name with alias" ],
  [ "-n", "--name NAME",       "The name of the robot in chat" ],
  [ "-r", "--require PATH",    "Alternative scripts path" ],
  [ "-v", "--version",         "Displays the version of hubot installed" ]
]

Options =
  adapter:     process.env.HUBOT_ADAPTER or "shell"
  alias:       process.env.HUBOT_ALIAS   or false
  create:      process.env.HUBOT_CREATE  or false
  enableHttpd: process.env.HUBOT_HTTPD   or true
  scripts:     process.env.HUBOT_SCRIPTS or []
  name:        process.env.HUBOT_NAME    or "Hubot"
  path:        process.env.HUBOT_PATH    or "."

Parser = new OptParse.OptionParser(Switches)
Parser.banner = "Usage hubot [options]"

Parser.on "adapter", (opt, value) ->
  Options.adapter = value

Parser.on "create", (opt, value) ->
  Options.path = value
  Options.create = true

Parser.on "disable-httpd", (opt) ->
  Options.enableHttpd = false

Parser.on "help", (opt, value) ->
  console.log Parser.toString()
  process.exit 0

Parser.on "alias", (opt, value) ->
  value or= '/'
  Options.alias = value

Parser.on "name", (opt, value) ->
  Options.name = value

Parser.on "require", (opt, value) ->
  Options.scripts.push(value)

Parser.on "version", (opt, value) ->
  Options.version = true

Parser.parse process.argv

unless process.platform is "win32"
  process.on 'SIGTERM', ->
    process.exit 0

if Options.create
  creator = new Creator(Options.path)
  creator.run()

else
  adapterPath = Path.join __dirname, "..", "src", "adapters"

  robot = Hubot.loadBot adapterPath, Options.adapter, Options.enableHttpd, Options.name

  if Options.version
    console.log robot.version
    process.exit 0

  robot.alias = Options.alias

  loadScripts = ->
    scriptsPath = Path.resolve ".", "scripts"
    robot.load scriptsPath

    scriptsPath = Path.resolve ".", "src", "scripts"
    robot.load scriptsPath

    hubotScripts = Path.resolve ".", "hubot-scripts.json"
    Fs.exists hubotScripts, (exists) ->
      if exists
        Fs.readFile hubotScripts, (err, data) ->
          if data.length > 0
            try
              scripts = JSON.parse data
              scriptsPath = Path.resolve "node_modules", "hubot-scripts", "src", "scripts"
              robot.loadHubotScripts scriptsPath, scripts
            catch err
              console.error "Error parsing JSON data from hubot-scripts.json: #{err}"
              process.exit(1)

    externalScripts = Path.resolve ".", "external-scripts.json"
    Fs.exists externalScripts, (exists) ->
      if exists
        Fs.readFile externalScripts, (err, data) ->
          if data.length > 0
            try
              scripts = JSON.parse data
            catch err
              console.error "Error parsing JSON data from external-scripts.json: #{err}"
              process.exit(1)
            robot.loadExternalScripts scripts

    for path in Options.scripts
      if path[0] == '/'
        scriptsPath = path
      else
        scriptsPath = Path.resolve ".", path
      robot.load scriptsPath

  robot.adapter.on 'connected', loadScripts

  robot.run()
