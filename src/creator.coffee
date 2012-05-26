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
  mkdirDashP: (path) ->
    Path.exists path, (exists) ->
      unless exists
        Fs.mkdir path, 0o0755, (err) ->
          throw err if err

  # Copy the contents of a file from one place to another.
  #
  # from - A String source file to copy, must exist on disk.
  # to   - A String destination file to write to.
  #
  # Returns nothing.
  copy: (from, to) ->
    Fs.readFile from, "utf8", (err, data) ->
      console.log "Copying #{Path.resolve(from)} -> #{Path.resolve(to)}"
      Fs.writeFileSync to, data, "utf8"

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
      "hubot-scripts.json"
    ]

    @copy "#{@templateDir}/#{file}", "#{@path}/#{file}" for file in files

module.exports = Creator
