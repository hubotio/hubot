'use strict'

import {EventEmitter} from 'events'
import File from 'fs/promises'
import path from 'path'
import {Log} from './log.mjs'
import HttpClient from './http-client.mjs'
import Http from 'http'
import Https from 'https'
import Brain from './brain.mjs'
import Response from './response.mjs'
import { Listener, TextListener } from './listener.mjs'
import { EnterMessage, LeaveMessage, TopicMessage, CatchAllMessage } from './message.mjs'
import Middleware from './middleware.mjs'
import express from 'express'
import multipart from 'connect-multiparty'
import pkg from '../package.json' assert {type: 'json'}
import {URL} from 'url'
const __dirname = new URL('.', import.meta.url).pathname
const HUBOT_DEFAULT_ADAPTERS = ['campfire', 'shell', 'slack-adapter']
const HUBOT_DOCUMENTATION_SECTIONS = ['description', 'dependencies', 'configuration', 'commands', 'notes', 'author', 'authors', 'examples', 'tags', 'urls']

class Robot {
  // Robots receive messages from a chat source (Campfire, irc, etc), and
  // dispatch them to matching listeners.
  //
  // adapterPath -  A String of the path to built-in adapters (defaults to src/adapters)
  // adapter     - A String of the adapter name.
  // name        - A String of the robot name, defaults to Hubot.
  // alias       - A String of the alias of the robot name
  // port       - Port to listen on. Can also be set by environment variables.
  constructor (adapterPath, adapter, name, alias, port, options) {
    if (name == null) {
      name = 'Hubot'
    }
    this.adapterPath = adapterPath
    this.port = port
    this.options = options
    this.cert = options?.cert
    this.key = options?.key
    this.name = name
    this.events = new EventEmitter()
    this.brain = new Brain(this)
    this.alias = alias
    this.adapter = null
    this.datastore = null
    this.Response = Response
    this.commands = []
    this.listeners = []
    this.middleware = {
      listener: new Middleware(this),
      response: new Middleware(this),
      receive: new Middleware(this)
    }
    this.logger = new Log(process.env.HUBOT_LOG_LEVEL || 'info')
    this.pingIntervalId = null
    this.globalHttpOptions = {}

    this.parseVersion()
    this.adapterName = adapter
  }
  static EVENTS = {
    RUNNING: 'running',
    SHUTDOWN: 'shutdown',
    ERROR: 'error'
  }
  // Public: Adds a custom Listener with the provided matcher, options, and
  // callback
  //
  // matcher  - A Function that determines whether to call the callback.
  //            Expected to return a truthy value if the callback should be
  //            executed.
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object if the
  //            matcher function returns true.
  //
  // Returns nothing.
  listen (matcher, options, callback) {
    this.listeners.push(new Listener(this, matcher, options, callback))
  }

  // Public: Adds a Listener that attempts to match incoming messages based on
  // a Regex.
  //
  // regex    - A Regex that determines if the callback should be called.
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  hear (regex, options, callback) {
    this.listeners.push(new TextListener(this, regex, options, callback))
  }

  // Public: Adds a Listener that attempts to match incoming messages directed
  // at the robot based on a Regex. All regexes treat patterns like they begin
  // with a '^'
  //
  // regex    - A Regex that determines if the callback should be called.
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  respond (regex, options, callback) {
    this.hear(this.respondPattern(regex), options, callback)
  }

  // Public: Build a regular expression that matches messages addressed
  // directly to the robot
  //
  // regex - A RegExp for the message part that follows the robot's name/alias
  //
  // Returns RegExp.
  respondPattern (regex) {
    const regexWithoutModifiers = regex.toString().split('/')
    regexWithoutModifiers.shift()
    const modifiers = regexWithoutModifiers.pop()
    const regexStartsWithAnchor = regexWithoutModifiers[0] && regexWithoutModifiers[0][0] === '^'
    const pattern = regexWithoutModifiers.join('/')
    const name = this.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

    if (regexStartsWithAnchor) {
      this.logger.warning('Anchors don’t work well with respond, perhaps you want to use \'hear\'')
      this.logger.warning(`The regex in question was ${regex.toString()}`)
    }

    if (!this.alias) {
      return new RegExp('^\\s*(?:@|<at>)?' + name + '(?::|,|<\/at>)?\\s*(?:' + pattern + ')', modifiers)
    }

    const alias = this.alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

    // matches properly when alias is substring of name
    if (name.length > alias.length) {
      return new RegExp('^\\s*(?:@|<at>)?(?:' + name + '(?::|,|<\/at>)?|' + alias + '(?::|,|<\/at>)?)\\s*(?:' + pattern + ')', modifiers)
    }

    // matches properly when name is substring of alias
    return new RegExp('^\\s*(?:@|<at>)?(?:' + alias + '(?::|,|<\/at>)?|' + name + '(?::|,|<\/at>)?)\\s*(?:' + pattern + ')', modifiers)
  }

  // Public: Adds a Listener that triggers when anyone enters the room.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  enter (options, callback) {
    this.listen(msg => msg instanceof EnterMessage, options, callback)
  }

  // Public: Adds a Listener that triggers when anyone leaves the room.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  leave (options, callback) {
    this.listen(msg => msg instanceof LeaveMessage, options, callback)
  }

  // Public: Adds a Listener that triggers when anyone changes the topic.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  topic (options, callback) {
    this.listen(msg => msg instanceof TopicMessage, options, callback)
  }

  // Public: Adds an error handler when an uncaught exception or user emitted
  // error event occurs.
  //
  // callback - A Function that is called with the error object.
  //
  // Returns nothing.
  error (callback) {
    this.errorHandlers.push(callback)
  }

  // Calls and passes any registered error handlers for unhandled exceptions or
  // user emitted error events.
  //
  // err - An Error object.
  // res - An optional Response object that generated the error
  //
  // Returns nothing.
  invokeErrorHandlers (error, res) {
    this.logger.error(error.stack)

    this.errorHandlers.forEach((errorHandler) => {
      try {
        errorHandler(error, res)
      } catch (errorHandlerError) {
        this.logger.error(`while invoking error handler: ${errorHandlerError}\n${errorHandlerError.stack}`)
      }
    })
  }

  // Public: Adds a Listener that triggers when no other text matchers match.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  catchAll (options, callback) {
    // `options` is optional; need to isolate the real callback before
    // wrapping it with logic below
    if (callback == null) {
      callback = options
      options = {}
    }

    this.listen(isCatchAllMessage, options, function listenCallback (msg) {
      msg.message = msg.message.message
      callback(msg)
    })
  }

  // Public: Registers new middleware for execution after matching but before
  // Listener callbacks
  //
  // middleware - A function that determines whether or not a given matching
  //              Listener should be executed. The function is called with
  //              (context, next, done). If execution should
  //              continue (next middleware, Listener callback), the middleware
  //              should call the 'next' function with 'done' as an argument.
  //              If not, the middleware should call the 'done' function with
  //              no arguments.
  //
  // Returns nothing.
  listenerMiddleware (middleware) {
    this.middleware.listener.register(middleware)
  }

  // Public: Registers new middleware for execution as a response to any
  // message is being sent.
  //
  // middleware - A function that examines an outgoing message and can modify
  //              it or prevent its sending. The function is called with
  //              (context, next, done). If execution should continue,
  //              the middleware should call next(done). If execution should
  //              stop, the middleware should call done(). To modify the
  //              outgoing message, set context.string to a new message.
  //
  // Returns nothing.
  responseMiddleware (middleware) {
    this.middleware.response.register(middleware)
  }

  // Public: Registers new middleware for execution before matching
  //
  // middleware - A function that determines whether or not listeners should be
  //              checked. The function is called with (context, next, done). If
  //              ext, next, done). If execution should continue to the next
  //              middleware or matching phase, it should call the 'next'
  //              function with 'done' as an argument. If not, the middleware
  //              should call the 'done' function with no arguments.
  //
  // Returns nothing.
  receiveMiddleware (middleware) {
    this.middleware.receive.register(middleware)
  }

  // Public: Passes the given message to any interested Listeners after running
  //         receive middleware.
  //
  // message - A Message instance. Listeners can flag this message as 'done' to
  //           prevent further execution.
  //
  // cb - Optional callback that is called when message processing is complete
  //
  // Returns nothing.
  // Returns before executing callback
  async receive (message) {
    // When everything is finished (down the middleware stack and back up),
    // pass control back to the robot
    await this.middleware.receive.execute({ response: new Response(this, message) })
    if(message.done) return

    let anyListenersExecuted = false
    for await(const listener of this.listeners) {
      try{
        await listener.call(message, this.middleware.listener, wasHandled => {
          anyListenersExecuted = anyListenersExecuted || wasHandled
        })
      }catch(err){
        this.emit(Robot.EVENTS.ERROR, err, message)
      }
      if(anyListenersExecuted && message.done) {
        break
      }
    }
    if(anyListenersExecuted) return

    if (!(message instanceof CatchAllMessage)) {
      this.logger.debug('No listeners executed; falling back to catch-all')
      await this.receive(new CatchAllMessage(message, message.adapterContext))
    }
  }

  // Public: Loads a file in path.
  //
  // filepath - A String path on the filesystem.
  // filename - A String filename in path on the filesystem.
  //
  // Returns nothing.
  async loadFile (filepath, filename) {
    const ext = path.extname(filename)
    const full = path.join(filepath, filename)
    // see https://github.com/hubotio/hubot/issues/1355
    if (!(['.mjs'].includes(ext))) { // eslint-disable-line
      return
    }
    try {
      await this.loadMjsFile(full)
    } catch (error) {
      this.logger.error(`Unable to load ${full}: ${error.stack}`)
      process.exit(1)
    }
  }

  async loadMjsFile (full) {
    const module = await import(full)
    if (typeof module.default === 'function') {
      module.default(this)
      await this.parseHelp(full)
    } else {
      this.logger.warning(`Expected ${full} to assign a function to module.exports, got ${typeof module}`)
    }
    return module
  }

  // Public: Loads every script in the given path.
  //
  // path - A String path on the filesystem.
  //
  // Returns nothing.
  async load (path) {
    this.logger.debug(`Loading scripts from ${path}`)
    try{
      const stats = await File.stat(path)
      if(!stats) return
      let files = await File.readdir(path)
      files = files.sort()
      for await(const file of files){
        await this.loadFile(path, file)
      }
    }catch(err){
      this.logger.debug(err)
    }
  }

  // Public: Load scripts specified in the `hubot-scripts.json` file.
  //
  // path    - A String path to the hubot-scripts files.
  // scripts - An Array of scripts to load.
  //
  // Returns nothing.
  async loadHubotScripts (path, scripts) {
    this.logger.debug(`Loading hubot-scripts from ${path}`)
    for await (const script of Array.from(scripts)) {
      await this.loadFile(path, script)
    }
  }

  // Public: Load scripts from packages specified in the
  // `external-scripts.json` file.
  //
  // packages - An Array of packages containing hubot scripts to load.
  //
  // Returns nothing.
  async loadExternalScripts (packages) {
    this.logger.debug('Loading external-scripts from npm packages')
    try {
      if (Array.isArray(packages)) {
        return packages.forEach(pkg => require(pkg)(this))
      }
      for await (const key of Object.keys(packages)){
        await import(key)(this, packages[key])
      }
    } catch (error) {
      this.logger.error(`Error loading scripts from npm package - ${error.stack}`)
      process.exit(1)
    }
  }

  // Setup the Express server's defaults.
  //
  // Returns nothing.
  async setupExpress () {
    const user = process.env.EXPRESS_USER
    const pass = process.env.EXPRESS_PASSWORD
    const stat = process.env.EXPRESS_STATIC
    this.port = this.port ?? process.env.EXPRESS_PORT ?? process.env.PORT ?? 8080
    const address = process.env.EXPRESS_BIND_ADDRESS || process.env.BIND_ADDRESS || '0.0.0.0'
    const limit = process.env.EXPRESS_LIMIT || '100kb'
    const paramLimit = parseInt(process.env.EXPRESS_PARAMETER_LIMIT) || 1000
    const app = express()

    app.use((req, res, next) => {
      res.setHeader('X-Powered-By', `hubot/${this.name}`)
      return next()
    })

    if (user && pass) {
      app.use(express.basicAuth(user, pass))
    }
    app.use(express.query())

    app.use(express.json())
    app.use(express.urlencoded({ limit, parameterLimit: paramLimit, extended: true }))
    // replacement for deprecated express.multipart/connect.multipart
    // limit to 100mb, as per the old behavior
    app.use(multipart({ maxFilesSize: 100 * 1024 * 1024 }))
    if (stat) {
      app.use(express.static(stat))
    }
    let h = Http
    let httpOptions = {}
    if(this.cert && this.key ) {
      h = Https
      this.port = 443
      httpOptions = {
        key: await File.readFile(this.key),
        cert: await File.readFile(this.cert)
      }
    }

    try {
      this.server = h.createServer(httpOptions, app).listen(this.port, ()=>{
        this.port = this.server.address().port ?? this.port
        console.log(`${this.name} listening on http://localhost:${this.port}`)
      })
      this.router = app
    } catch (error) {
      const err = error
      this.logger.error(`Error trying to start HTTP server: ${err}\n${err.stack}`)
      process.exit(1)
    }
    return app
  }

  // Load the adapter Hubot is going to use.
  //
  // path    - A String of the path to adapter if local.
  // adapter - A String of the adapter name to use.
  //
  // Returns nothing.
  async loadAdapter (adapter) {
    let fileName = `${this.adapterPath}/${adapter}`
    const localAdapterPath = `${this.adapterPath}/${adapter}`
    let stats = null
    try{
      stats = await File.stat(localAdapterPath)
      fileName = localAdapterPath
    }catch(e){
      this.logger.debug(`${localAdapterPath} not found, trying installed modules`)
      fileName = `hubot-${adapter}`
    }
    try {
      this.logger.debug(`Loading adapter from ${fileName}`)
      const module = await import(fileName)
      this.adapter = await module.default(this)
    } catch (err) {
      this.logger.error(err)
      process.exit(1)
    }
  }

  // Public: Help Commands for Running Scripts.
  //
  // Returns an Array of help commands for running scripts.
  helpCommands () {
    return this.commands.sort()
  }

  // Private: load help info from a loaded script.
  //
  // path - A String path to the file on disk.
  //
  // Returns nothing.
  async parseHelp (path) {
    const scriptDocumentation = {}
    const body = await File.readFile(path, 'utf-8')

    const useStrictHeaderRegex = /^["']use strict['"];?\s+/
    const lines = body.replace(useStrictHeaderRegex, '').split(/(?:\n|\r\n|\r)/)
      .reduce(toHeaderCommentBlock, { lines: [], isHeader: true }).lines
      .filter(Boolean) // remove empty lines
    let currentSection = null
    let nextSection

    this.logger.debug(`Parsing help for ${path}`)

    for (let i = 0, line; i < lines.length; i++) {
      line = lines[i]

      if (line.toLowerCase() === 'none') {
        continue
      }

      nextSection = line.toLowerCase().replace(':', '')
      if (Array.from(HUBOT_DOCUMENTATION_SECTIONS).indexOf(nextSection) !== -1) {
        currentSection = nextSection
        scriptDocumentation[currentSection] = []
      } else {
        if (currentSection) {
          scriptDocumentation[currentSection].push(line)
          if (currentSection === 'commands') {
            this.commands.push(line)
          }
        }
      }
    }

    if (currentSection === null) {
      this.logger.info(`${path} is using deprecated documentation syntax`)
      scriptDocumentation.commands = []
      for (let i = 0, line, cleanedLine; i < lines.length; i++) {
        line = lines[i]
        if (line.match('-')) {
          continue
        }

        cleanedLine = line.slice(2, +line.length + 1 || 9e9).replace(/^hubot/i, this.name).trim()
        scriptDocumentation.commands.push(cleanedLine)
        this.commands.push(cleanedLine)
      }
    }
  }

  // Public: A helper send function which delegates to the adapter's send
  // function.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns depends on the adapter.
  async send (envelope, ...strings) {
    return this.adapter.send(envelope, ...strings)
  }

  // Public: A helper reply function which delegates to the adapter's reply
  // function.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns nothing.
  async reply (envelope, ...strings) {
    await this.adapter.reply(envelope, ...strings)
  }

  // Public: A helper send function to message a room that the robot is in.
  //
  // room    - String designating the room to message.
  // strings - One or more Strings for each message to send.
  //
  // Returns.
  async messageRoom (room, ...strings) {
    const envelope = { room }
    return this.adapter.send(envelope, ...strings)
  }

  // Public: A wrapper around the EventEmitter API to make usage
  // semantically better.
  //
  // event    - The event name.
  // listener - A Function that is called with the event parameter
  //            when event happens.
  //
  // Returns nothing.
  on (event/* , ...args */) {
    const args = [].slice.call(arguments, 1)
    this.events.on.apply(this.events, [event].concat(args))
  }

  // Public: A wrapper around the EventEmitter API to make usage
  // semantically better.
  //
  // event   - The event name.
  // args...  - Arguments emitted by the event
  //
  // Returns nothing.
  emit (event/* , ...args */) {
    const args = [].slice.call(arguments, 1)
    this.events.emit.apply(this.events, [event].concat(args))
  }

  // Public: Kick off the event loop for the adapter
  //
  // Returns nothing.
  run () {
    this.emit(Robot.EVENTS.RUNNING)
    this.adapter.run()
  }

  // Public: Gracefully shutdown the robot process
  //
  // Returns nothing.
  shutdown () {
    if (this.pingIntervalId != null) {
      clearInterval(this.pingIntervalId)
    }
    if(this.onUncaughtException) process.removeListener('uncaughtException', this.onUncaughtException)
    if(this.adapter) this.adapter.close()
    if(this.server) this.server.close()
    if(this.brain) this.brain.close()
    this.emit(Robot.EVENTS.SHUTDOWN)
  }

  // Public: The version of Hubot from npm
  //
  // Returns a String of the version number.
  parseVersion () {
    this.version = pkg.version
    return this.version
  }

  // Public: Creates a scoped http client with chainable methods for
  // modifying the request. This doesn't actually make a request though.
  // Once your request is assembled, you can call `get()`/`post()`/etc to
  // send the request.
  //
  // url - String URL to access.
  // options - Optional options to pass on to the client
  //
  // Examples:
  //
  //     robot.http("http://example.com")
  //       # set a single header
  //       .header('Authorization', 'bearer abcdef')
  //
  //       # set multiple headers
  //       .headers(Authorization: 'bearer abcdef', Accept: 'application/json')
  //
  //       # add URI query parameters
  //       .query(a: 1, b: 'foo & bar')
  //
  //       # make the actual request
  //       .get() (err, res, body) ->
  //         console.log body
  //
  //       # or, you can POST data
  //       .post(data) (err, res, body) ->
  //         console.log body
  //
  //    # Can also set options
  //    robot.http("https://example.com", {rejectUnauthorized: false})
  //
  // Returns a ScopedClient instance.
  http (url, options) {
    const httpOptions = extend({}, this.globalHttpOptions, options)
    const c = HttpClient.create(url, httpOptions).header('User-Agent', `Hubot/${this.version}`)
    return c
  }
}

function isCatchAllMessage (message) {
  return message instanceof CatchAllMessage
}

function toHeaderCommentBlock (block, currentLine) {
  if (isCommentLine(currentLine)) {
    block.lines.push(removeCommentPrefix(currentLine))
  } else {
    block.isHeader = false
  }

  return block
}

function isCommentLine (line) {
  return /^(#|\/\/)/.test(line)
}

function removeCommentPrefix (line) {
  return line.replace(/^[#/]+\s*/, '')
}

function extend (obj/* , ...sources */) {
  const sources = [].slice.call(arguments, 1)

  sources.forEach((source) => {
    if (typeof source !== 'object') {
      return
    }

    Object.keys(source).forEach((key) => {
      obj[key] = source[key]
    })
  })

  return obj
}

export default Robot
