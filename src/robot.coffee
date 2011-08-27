Fs   = require 'fs'
Url  = require 'url'
Path = require 'path'

# Robots receive messages from a chat source (Campfire, irc, etc), and
# dispatch them to matching listeners.
class Robot
  constructor: (path) ->
    @listeners = []
    if path then @load path

  # Adds a Listener that attempts to match incoming messages based on a Regex.
  hear: (regex, callback) ->
    @listeners.push new Listener(@, regex, callback)

  # Passes the given message to any interested Listeners.
  receive: (message) ->
    @listeners.forEach (lst) -> lst.call message

  load: (path) ->
    Fs.readdirSync(path).forEach (file) =>
      ext  = Path.extname file
      full = Path.join path, Path.basename(file, ext)
      if ext == '.coffee' or ext == '.js'
        require(full) @

  # Raw method for sending data back to the chat source.  Extend this.
  send: (user, strings...) ->

  # Raw method for building a reply and sending it back to the chat source.
  # Extend this.
  reply: (user, strings...) ->

  # Raw method for invoking the bot to run
  # Extend this.
  run: () ->

# Listeners receive every message from the chat source and decide if they want
# to act on it.
class Listener
  constructor: (@robot, @regex, @callback) ->

  # Determines if the listener likes the content of the message.  If so, a
  # Response built from the given Message is passed to the Listener callback.
  call: (message) ->
    match = message.text.match @regex
    return if not match
    @callback new Response(@robot, message, match)

# Responses are sent to matching listeners.  Messages know about the content
# and user that made the original message, and how to reply back to them.
class Response
  constructor: (@robot, @message, @match) ->

  # Posts a message back to the chat source
  #
  # strings - One or more strings to be posted.  The order of these strings
  #           should be kept intact.
  #
  # Returns nothing.
  send: (strings...) ->
    @robot.send @message.user, strings...

  # Posts a message mentioning the current user.
  #
  # strings - One or more strings to be posted.  The order of these strings
  #           should be kept intact.
  #
  # Returns nothing.
  reply: (strings...) ->
    @robot.reply @message.user, strings...

  random: (items) ->
    items[ Math.floor(Math.random() * items.length) ]

  # helper for making quick HTTP GET requests.
  # otherwise, use @http for the rad Node 0.4 HTTP Client.
  fetch: (url, cb) ->
    uri = Url.parse url
    body = ''
    @http.get({
      host: uri.host
      port: uri.port or 80
      path: "#{uri.pathname}?#{uri.query}"
    }, (res) ->
      res.on 'data', (chunk) -> body += chunk.toString()
      res.on 'end', ->
        res.body = body
        cb res
    )

Response.prototype.http = require('http')

module.exports = Robot
