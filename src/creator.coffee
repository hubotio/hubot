Fs   = require 'fs'
Path = require 'path'

class Creator
  constructor: (path) ->
    @path = path
    @templateDir = "#{__dirname}/templates"
    @scriptsDir  = "#{__dirname}/scripts"

  mkdirDashP: (path) ->
    Fs.exists path, (exists) ->
      unless exists
        Fs.mkdir path, 0o0755, (err) ->
          throw err if err

  copy: (from, to) ->
    Fs.readFile from, "utf8", (err, data) ->
      console.log "Copying #{Path.resolve(from)} -> #{Path.resolve(to)}"
      Fs.writeFileSync to, data, "utf8"

  copyDefaultScripts: (path) ->
    for file in Fs.readdirSync(@scriptsDir)
      @copy "#{@scriptsDir}/#{file}", "#{path}/#{file}"

  run: ->
    console.log "Creating a hubot install at #{@path}"

    @mkdirDashP(@path)
    @mkdirDashP("#{@path}/bin")
    @mkdirDashP("#{@path}/scripts")

    @copyDefaultScripts("#{@path}/scripts")

    files = [
      "Procfile",
      "package.json",
      "README.md",
      ".gitignore",
      "bin/hubot",
      "bin/hubot.cmd",
      "hubot-scripts.json",
      "external-scripts.json"
    ]

    @copy "#{@templateDir}/#{file}", "#{@path}/#{file}" for file in files

module.exports = Creator
