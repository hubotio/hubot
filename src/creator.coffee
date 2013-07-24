Fs   = require 'fs'
Path = require 'path'

# Simple generator class for deploying a version of hubot on heroku
class Creator
  # Setup a ready to go version of hubot
  #
  # path - A String directory to create/upgrade scripts for
  constructor: (path) ->
    @path = path
    @templateDir = "#{__dirname}/templates"
    @scriptsDir  = "#{__dirname}/scripts"

  # Create a folder if it doesn't already exist.
  #
  # Returns nothing.
  mkdir: (path) ->
    Fs.exists path, (exists) ->
      unless exists
        Fs.mkdirSync path, 0o0755

  # Copy the contents of a file from one place to another.
  #
  # from - A String source file to copy, must exist on disk.
  # to   - A String destination file to write to.
  #
  # Returns nothing.
  copy: (from, to, callback) ->
    Fs.readFile from, "utf8", (err, data) ->
      console.log "Copying #{Path.resolve(from)} -> #{Path.resolve(to)}"
      Fs.writeFileSync to, data, "utf8"

      callback(err, to) if callback?

  # Rename a file.
  #
  # from - A String source file to rename, must exist on disk.
  # to   - A String destination file to write to.
  #
  # Returns nothing.
  rename: (from, to, callback) ->
    Fs.rename from, to, (err, data) ->
      console.log "Renaming #{Path.resolve(from)} -> #{Path.resolve(to)}"

      callback(err, to) if callback?

  # Copy the default scripts hubot ships with to the scripts folder
  # This allows people to easily remove scripts hubot defaults to if
  # they want. It also provides them with a few examples and a top
  # level scripts folder.
  #
  # path - The destination.
  #
  # Returns nothing.
  copyDefaultScripts: (path) ->
    for file in Fs.readdirSync(@scriptsDir)
      @copy "#{@scriptsDir}/#{file}", "#{path}/#{file}"

  # Public: Run the creator process.
  #
  # Setup a ready to deploy folder that uses the hubot npm package
  # Overwriting basic hubot files if they exist
  #
  # Returns nothing.
  run: ->
    console.log "Creating a hubot install at #{@path}"

    @mkdir(@path)
    @mkdir("#{@path}/bin")
    @mkdir("#{@path}/scripts")

    @copyDefaultScripts("#{@path}/scripts")

    files = [
      "Procfile",
      "package.json",
      "README.md",
      "gitignore",
      "hubot-scripts.json",
      "external-scripts.json"
    ]
    for file in files
      @copy "#{@templateDir}/#{file}", "#{@path}/#{file}", (err, to)=>
        @rename "#{@path}/gitignore", "#{@path}/.gitignore" if to == "#{@path}/gitignore"

    bins = [
      "bin/hubot",
      "bin/hubot.cmd"
    ]

    for bin in bins
      @copy "#{@templateDir}/#{bin}", "#{@path}/#{bin}", (err, binPath) =>
        Fs.chmodSync binPath, 0o755

module.exports = Creator
