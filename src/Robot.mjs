'use strict'

import EventEmitter from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import pino from 'pino'
import HttpClient from './HttpClient.mjs'
import Brain from './Brain.mjs'
import Response from './Response.mjs'
import { Listener, TextListener } from './Listener.mjs'
import Message from './Message.mjs'
import Middleware from './Middleware.mjs'
import { parseHelp } from './HelpParser.mjs'

const File = fs.promises
const HUBOT_DEFAULT_ADAPTERS = ['Campfire', 'Shell']

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Robot {
  // Robots receive messages from a chat source (Campfire, irc, etc), and
  // dispatch them to matching listeners.
  //
  // adapter     - A String of the adapter name.
  // httpd       - A Boolean whether to enable the HTTP daemon.
  // name        - A String of the robot name, defaults to Hubot.
  // alias       - A String of the alias of the robot name
  constructor (adapter, httpd, name, alias) {
    if (name == null) {
      name = 'Hubot'
    }
    if (alias == null) {
      alias = false
    }

    this.name = name
    this.events = new EventEmitter()
    this.brain = new Brain(this)
    this.alias = alias
    this.adapter = null
    this.adapterName = 'Shell'
    if (adapter && typeof (adapter) === 'object') {
      this.adapter = adapter
      this.adapterName = adapter.name ?? adapter.constructor.name
    } else {
      this.adapterName = adapter ?? this.adapterName
    }

    this.shouldEnableHttpd = httpd ?? true
    this.datastore = null
    this.Response = Response
    this.commands = []
    this.listeners = []
    this.middleware = {
      listener: new Middleware(this),
      response: new Middleware(this),
      receive: new Middleware(this)
    }
    this.logger = pino({
      name,
      level: process.env.HUBOT_LOG_LEVEL || 'info'
    })

    this.pingIntervalId = null
    this.globalHttpOptions = {}

    this.parseVersion()
    this.errorHandlers = []
    this.catchAllListenerExecuted = false

    this.on('error', (err, res) => {
      return this.invokeErrorHandlers(err, res)
    })
    this.on('listening', this.herokuKeepalive.bind(this))
  }

  // Internal: Listener registry mapping predefined message type keys to their matcher predicates.
  // Used by _registerListener() to consolidate similar listener registration methods.
  static LISTENER_REGISTRY = {
    enter: msg => msg instanceof Message.EnterMessage,
    leave: msg => msg instanceof Message.LeaveMessage,
    topic: msg => msg instanceof Message.TopicMessage
  }

  // Internal: Register a listener using a predefined matcher predicate from LISTENER_REGISTRY.
  //
  // registryKey - A String key into LISTENER_REGISTRY (e.g., 'enter', 'leave', 'topic').
  // options     - An Object of additional parameters keyed on extension name (optional).
  // callback    - A Function that is called with a Response object.
  //
  // Returns nothing.
  _registerListener (registryKey, options, callback) {
    const predicate = Robot.LISTENER_REGISTRY[registryKey]
    if (!predicate) {
      throw new Error(`Unknown listener registry key: ${registryKey}`)
    }
    this.listen(predicate, options, callback)
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
      this.logger.warn('Anchors don’t work well with respond, perhaps you want to use \'hear\'')
      this.logger.warn(`The regex in question was ${regex.toString()}`)
    }

    if (!this.alias) {
      return new RegExp('^\\s*[@]?' + name + '[:,]?\\s*(?:' + pattern + ')', modifiers)
    }

    const alias = this.alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

    // matches properly when alias is substring of name
    if (name.length > alias.length) {
      return new RegExp('^\\s*[@]?(?:' + name + '[:,]?|' + alias + '[:,]?)\\s*(?:' + pattern + ')', modifiers)
    }

    // matches properly when name is substring of alias
    return new RegExp('^\\s*[@]?(?:' + alias + '[:,]?|' + name + '[:,]?)\\s*(?:' + pattern + ')', modifiers)
  }

  // Public: Adds a Listener that triggers when anyone enters the room.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  enter (options, callback) {
    this._registerListener('enter', options, callback)
  }

  // Public: Adds a Listener that triggers when anyone leaves the room.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  leave (options, callback) {
    this._registerListener('leave', options, callback)
  }

  // Public: Adds a Listener that triggers when anyone changes the topic.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  topic (options, callback) {
    this._registerListener('topic', options, callback)
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

    // Cheap Design: Register catch-all as a normal listener.
    // No special handling in processListeners—it competes with other listeners
    // but is only matched when message type is CatchAllMessage (which only happens
    // when no other listener matched). This eliminates the recursive fallback.
    this.listen(isCatchAllMessage, options, async msg => {
      await callback(msg)
    })
  }

  // Public: Registers new middleware for execution after matching but before
  // Listener callbacks
  //
  // middleware - A function that determines whether or not a given matching
  //              Listener should be executed. The function is called with
  //              (context). If execution should, the middleware should return
  //              true. If not, the middleware should return false.
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
  //              (context). If execution should continue, return true
  //              otherwise return false to stop. To modify the
  //              outgoing message, set context.string to a new message.
  //
  // Returns nothing.
  responseMiddleware (middleware) {
    this.middleware.response.register(middleware)
  }

  // Public: Registers new middleware for execution before matching
  //
  // middleware - A function that determines whether or not listeners should be
  //              checked. The function is called with (context). If execution
  //              should continue to the next
  //              middleware or matching phase, it should return true or nothing
  //              otherwise return false to stop.
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
  // Returns array of results from listeners.
  async receive (message) {
    const context = { response: new Response(this, message) }
    // Cheap Design: Use Middleware.executeAndAllow() to simplify the
    // middleware invocation and conditional check into a single semantic call
    const shouldContinue = await this.middleware.receive.executeAndAllow(context)
    if (!shouldContinue) return null
    return await this.processListeners(context)
  }

  // Private: Passes the given message to any interested Listeners.
  //
  // message - A Message instance. Listeners can flag this message as 'done' to
  //           prevent further execution.
  //
  // Returns array of results from listeners.
  async processListeners (context) {
    // Try executing all registered Listeners in order of registration
    // and return after message is done being processed
    const results = []
    let anyListenersExecuted = false
    for await (const listener of this.listeners) {
      try {
        const match = listener.matcher(context.response.message)
        if (!match) {
          continue
        }
        const result = await listener.call(context.response.message, this.middleware.listener)
        results.push(result)
        anyListenersExecuted = true
      } catch (err) {
        this.emit('error', err, context)
      }
      if (context.response.message.done) {
        break
      }
    }

    // Cheap Design: Replace recursive receive() with simple message type conversion.
    // Let the listener table handle catch-all uniformly by just changing the message type.
    // No special fallback logic, no recursion—just data transformation followed by
    // a second pass through the same listener loop. Catch-all listeners match via
    // isCatchAllMessage predicate, so this naturally triggers them in the loop above.
    if (!isCatchAllMessage(context.response.message) && !anyListenersExecuted) {
      this.logger.debug('No listeners executed; converting to catch-all message')
      const catchAllMsg = new Message.CatchAllMessage(context.response.message)
      context.response.message = catchAllMsg
      // Re-process listeners with the converted message type
      return await this.processListeners(context)
    }

    return results
  }

  // Private: Generic loader applying Cheap Design by consolidating
  // duplicated extension-specific logic. Offloads variation to data (ext)
  // while keeping a single control path.
  async _loadScript (filePath, ext) {
    const forImport = this.prepareForImport(filePath)
    let exported
    try {
      exported = await import(forImport)
    } catch (err) {
      this.logger.error(`Import failed for ${filePath}: ${err.stack}`)
      throw err
    }
    const scriptFn = exported?.default
    if (typeof scriptFn === 'function') {
      return await scriptFn(this)
    }
    this.logger.warn(`Expected ${filePath} (${ext}) default export to be function, got ${typeof scriptFn}`)
    return null
  }

  async loadmjs (filePath) {
    return await this._loadScript(filePath, 'mjs')
  }

  async loadts (filePath) {
    return await this._loadScript(filePath, 'ts')
  }

  async loadjs (filePath) {
    return await this._loadScript(filePath, 'js')
  }

  // Public: Loads a file in path.
  //
  // filepath - A String path on the filesystem.
  // filename - A String filename in path on the filesystem.
  //
  // Returns nothing.
  async loadFile (filepath, filename) {
    const ext = path.extname(filename)?.replace('.', '')
    const full = path.join(filepath, path.basename(filename))

    // see https://github.com/hubotio/hubot/issues/1355
    if (['js', 'mjs', 'ts'].indexOf(ext) === -1) {
      this.logger.debug(`Skipping unsupported file type ${full}`)
      return null
    }
    let result = null
    try {
      // Cheap Design: remove branching differences, rely on consolidated loader
      result = await this[`load${ext}`](full)
      this.parseHelp(full)
    } catch (error) {
      this.logger.error(`Unable to load ${full}: ${error.stack}`)
      throw error
    }
    return result
  }

  // Public: Loads every script in the given path.
  //
  // path - A String path on the filesystem.
  //
  // Returns nothing.
  async load (path) {
    this.logger.debug(`Loading scripts from ${path}`)
    const results = []
    try {
      const folder = await File.readdir(path, { withFileTypes: true })
      for await (const file of folder) {
        if (file.isDirectory()) continue
        try {
          const result = await this.loadFile(path, file.name)
          results.push(result)
        } catch (e) {
          this.logger.error(`Error loading file ${file.name} - ${e.stack}`)
        }
      }
    } catch (e) {
      this.logger.error(`Path ${path} does not exist`)
    }
    return results
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
        for await (const pkg of packages) {
          (await import(pkg)).default(this)
        }
        return
      }
      for await (const key of Object.keys(packages)) {
        (await import(key)).default(this, packages[key])
      }
    } catch (error) {
      this.logger.error(`Error loading scripts from npm package - ${error.stack}`)
      throw error
    }
  }

  // Setup the Express server's defaults.
  //
  // Returns Server.
  async setupExpress () {
    const user = process.env.EXPRESS_USER
    const pass = process.env.EXPRESS_PASSWORD
    const stat = process.env.EXPRESS_STATIC
    const port = process.env.EXPRESS_PORT || process.env.PORT || 8080
    const address = process.env.EXPRESS_BIND_ADDRESS || process.env.BIND_ADDRESS || '0.0.0.0'
    const limit = process.env.EXPRESS_LIMIT || '100kb'
    const paramLimit = parseInt(process.env.EXPRESS_PARAMETER_LIMIT) || 1000

    const express = (await import('express')).default
    const basicAuth = (await import('express-basic-auth')).default

    const app = express()

    app.use((req, res, next) => {
      res.setHeader('X-Powered-By', `hubot/${encodeURI(this.name)}`)
      return next()
    })

    if (user && pass) {
      const authUser = {}
      authUser[user] = pass
      app.use(basicAuth({ users: authUser }))
    }

    app.use(express.json({ limit }))
    app.use(express.urlencoded({ limit, parameterLimit: paramLimit, extended: true }))

    if (stat) {
      app.use(express.static(stat))
    }
    return new Promise((resolve, reject) => {
      try {
        this.server = app.listen(port, address, () => {
          this.router = app
          this.emit('listening', this.server)
          resolve(this.server)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  // Setup an empty router object
  //
  // returns nothing
  setupNullRouter () {
    const msg = 'A script has tried registering a HTTP route while the HTTP server is disabled with --disabled-httpd.'
    const self = this
    this.router = {
      get: () => self.logger.info(msg),
      post: () => self.logger.info(msg),
      put: () => self.logger.info(msg),
      delete: () => self.logger.info(msg)
    }
  }

  // Load the adapter Hubot is going to use.
  //
  // path    - A String of the path to adapter if local.
  // adapter - A String of the adapter name to use.
  //
  // Returns nothing.
  async loadAdapter (adapterPath = null) {
    if (this.adapter && this.adapter.use) {
      this.adapter = await this.adapter.use(this)
      this.adapterName = this.adapter.name ?? this.adapter.constructor.name
      return
    }
    this.logger.debug(`Loading adapter ${adapterPath ?? 'from npmjs:'} ${this.adapterName}`)
    try {
      // Cheap Design: Resolve strategy table driven by adapter state/path,
      // eliminating nested if/else branching. Each strategy is a simple resolver.
      const resolver = this._selectAdapterResolver(adapterPath)
      this.adapter = await resolver.call(this, adapterPath)
    } catch (error) {
      this.logger.error(`Cannot load adapter ${adapterPath ?? '[no path set]'} ${this.adapterName} - ${error}`)
      throw error
    }

    this.adapterName = this.adapter.name ?? this.adapter.constructor.name
  }

  // Private: Select the appropriate adapter resolver based on path and adapter name.
  // Returns a resolver function that loads and returns the adapter.
  _selectAdapterResolver (adapterPath) {
    const ext = path.extname(adapterPath ?? '')
    const isBuiltin = Array.from(HUBOT_DEFAULT_ADAPTERS).indexOf(this.adapterName) > -1

    // Resolver table: condition => resolver function
    const resolvers = {
      builtinAdapter: () => isBuiltin,
      commonJsFile: () => ['.js', '.cjs'].includes(ext),
      esModuleFile: () => ['.mjs'].includes(ext),
      npmPackage: () => true // fallback
    }

    const resolverMap = {
      builtinAdapter: this._loadBuiltinAdapter,
      commonJsFile: this._loadLocalAdapter,
      esModuleFile: this._loadLocalAdapter,
      npmPackage: this._loadNpmAdapter
    }

    // Find the first matching condition and return its resolver
    for (const [key, condition] of Object.entries(resolvers)) {
      if (condition()) {
        return resolverMap[key]
      }
    }
  }

  // Private: Load a built-in adapter from src/adapters/
  async _loadBuiltinAdapter (adapterPath) {
    const builtinPath = path.resolve(path.join(__dirname, 'adapters', `${this.adapterName}.mjs`))
    const forImport = this.prepareForImport(builtinPath)
    return await (await import(forImport)).default.use(this)
  }

  // Private: Load a local adapter from a file path.
  async _loadLocalAdapter (adapterPath) {
    const resolvedPath = path.resolve(adapterPath)
    const forImport = this.prepareForImport(resolvedPath)
    return await (await import(forImport)).default.use(this)
  }

  // Private: Load an npm package adapter.
  async _loadNpmAdapter (adapterPath) {
    return await (await import(this.adapterName)).default.use(this)
  }

  // Public: Help Commands for Running Scripts.
  //
  // Returns an Array of help commands for running scripts.
  helpCommands () {
    return this.commands.sort()
  }

  // Private: load help info from a loaded script.
  //
  // filePath - A String path to the file on disk.
  //
  // Returns nothing.
  parseHelp (filePath) {
    // Cheap Design: Extracted help parsing into a dedicated utility module.
    // Robot no longer needs to understand comment extraction or documentation
    // section parsing—it just delegates to HelpParser and collects commands.
    this.logger.debug(`Parsing help for ${filePath}`)

    try {
      const { commands, legacyMode } = parseHelp(filePath, this.name)

      if (legacyMode) {
        this.logger.info(`${filePath} is using deprecated documentation syntax`)
      }

      // Collect commands from this script
      this.commands.push(...commands)
    } catch (error) {
      this.logger.error(`Failed to parse help for ${filePath}: ${error.stack}`)
    }
  }

  // Public: A helper send function which delegates to the adapter's send
  // function.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns whatever the extending adapter returns.
  async send (envelope, ...strings) {
    return await this.adapter.send(envelope, ...strings)
  }

  // Public: A helper reply function which delegates to the adapter's reply
  // function.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns whatever the extending adapter returns.
  async reply (envelope, ...strings) {
    return await this.adapter.reply(envelope, ...strings)
  }

  // Public: A helper send function to message a room that the robot is in.
  //
  // room    - String designating the room to message.
  // strings - One or more Strings for each message to send.
  //
  // Returns whatever the extending adapter returns.
  async messageRoom (room, ...strings) {
    const envelope = { room }
    return await this.adapter.send(envelope, ...strings)
  }

  // Public: A wrapper around the EventEmitter API to make usage
  // semantically better.
  //
  // event    - The event name.
  // listener - A Function that is called with the event parameter
  //            when event happens.
  //
  // Returns nothing.
  on (event, ...args) {
    this.events.on(event, ...args)
  }

  // Public: A wrapper around the EventEmitter API to make usage
  // semantically better.
  //
  // event   - The event name.
  // args...  - Arguments emitted by the event
  //
  // Returns nothing.
  emit (event, ...args) {
    this.events.emit(event, ...args)
  }

  // Public: Kick off the event loop for the adapter
  //
  // Returns whatever the adapter returns.
  async run () {
    if (this.shouldEnableHttpd) {
      await this.setupExpress()
    } else {
      this.setupNullRouter()
    }
    await this.adapter.run()
    this.emit('running')
  }

  // Public: Gracefully shutdown the robot process
  //
  // Returns nothing.
  shutdown () {
    if (this.pingIntervalId != null) {
      clearInterval(this.pingIntervalId)
    }
    this.adapter?.close()
    if (this.server) {
      this.server.close()
    }
    this.brain.close()
    this.events.removeAllListeners()
  }

  prepareForImport (filePath) {
    return pathToFileURL(filePath)
  }

  // Public: The version of Hubot from npm
  //
  // Returns a String of the version number.
  parseVersion () {
    const pkg = fs.readFileSync(path.join(__dirname, '..', 'package.json'))
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

    return HttpClient.create(url, httpOptions).header('User-Agent', `Hubot/${this.version}`)
  }

  herokuKeepalive (server) {
    let herokuUrl = process.env.HEROKU_URL
    if (herokuUrl) {
      if (!/\/$/.test(herokuUrl)) {
        herokuUrl += '/'
      }
      this.pingIntervalId = setInterval(() => {
        HttpClient.create(`${herokuUrl}hubot/ping`).post()((_err, res, body) => {
          this.logger.info('keep alive ping!')
        })
      }, 5 * 60 * 1000)
    }
  }
}

function isCatchAllMessage (message) {
  return message instanceof Message.CatchAllMessage
}

function extend (obj, ...sources) {
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
