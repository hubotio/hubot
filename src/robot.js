'use strict'
const EventEmitter = require('events').EventEmitter
const fs = require('fs')
const path = require('path')
const pathToFileURL = require('url').pathToFileURL

const pino = require('pino')
const HttpClient = require('./httpclient')

const Brain = require('./brain')
const Response = require('./response')
const Listener = require('./listener')
const Message = require('./message')
const Middleware = require('./middleware')

const HUBOT_DEFAULT_ADAPTERS = ['campfire', 'shell']
const HUBOT_DOCUMENTATION_SECTIONS = ['description', 'dependencies', 'configuration', 'commands', 'notes', 'author', 'authors', 'examples', 'tags', 'urls']

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
    this.adapterName = adapter ?? 'shell'
    this.errorHandlers = []

    this.on('error', (err, res) => {
      return this.invokeErrorHandlers(err, res)
    })
    this.on('listening', this.herokuKeepalive.bind(this))
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
    this.listeners.push(new Listener.Listener(this, matcher, options, callback))
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
    this.listeners.push(new Listener.TextListener(this, regex, options, callback))
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
    this.listen(msg => msg instanceof Message.EnterMessage, options, callback)
  }

  // Public: Adds a Listener that triggers when anyone leaves the room.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  leave (options, callback) {
    this.listen(msg => msg instanceof Message.LeaveMessage, options, callback)
  }

  // Public: Adds a Listener that triggers when anyone changes the topic.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  topic (options, callback) {
    this.listen(msg => msg instanceof Message.TopicMessage, options, callback)
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

    this.listen(isCatchAllMessage, options, async msg => {
      await callback(msg.message)
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
    const shouldContinue = await this.middleware.receive.execute(context)
    if (shouldContinue === false) return null
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

    if (!isCatchAllMessage(context.response.message) && !anyListenersExecuted) {
      this.logger.debug('No listeners executed; falling back to catch-all')
      try {
        const result = await this.receive(new Message.CatchAllMessage(context.response.message))
        results.push(result)
      } catch (err) {
        this.emit('error', err, context)
      }
    }

    return results
  }

  async loadmjs (filePath) {
    const script = await import(pathToFileURL(filePath))
    if (typeof script?.default === 'function') {
      script.default(this)
    } else {
      this.logger.warning(`Expected ${filePath} to assign a function to export default, got ${typeof script}`)
    }
  }

  async loadcoffee (filePath) {
    return await this.loadjs(filePath)
  }

  async loadjs (filePath) {
    const script = require(filePath)
    if (typeof script === 'function') {
      script(this)
    } else {
      this.logger.warning(`Expected ${filePath} to assign a function to module.exports, got ${typeof script}`)
    }
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
    if (['js', 'mjs', 'coffee'].indexOf(ext) === -1) {
      this.logger.debug(`Skipping unsupported file type ${full}`)
      return
    }

    try {
      await this[`load${ext}`](full)
      this.parseHelp(full)
    } catch (error) {
      this.logger.error(`Unable to load ${full}: ${error.stack}`)
      throw error
    }
  }

  // Public: Loads every script in the given path.
  //
  // path - A String path on the filesystem.
  //
  // Returns nothing.
  async load (path) {
    this.logger.debug(`Loading scripts from ${path}`)

    if (fs.existsSync(path)) {
      const tasks = fs.readdirSync(path).sort().map(file => this.loadFile(path, file))
      await Promise.all(tasks)
    }
  }

  // Public: Load scripts from packages specified in the
  // `external-scripts.json` file.
  //
  // packages - An Array of packages containing hubot scripts to load.
  //
  // Returns nothing.
  loadExternalScripts (packages) {
    this.logger.debug('Loading external-scripts from npm packages')

    try {
      if (Array.isArray(packages)) {
        return packages.forEach(pkg => require(pkg)(this))
      }

      Object.keys(packages).forEach(key => require(key)(this, packages[key]))
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

    const express = require('express')
    const basicAuth = require('express-basic-auth')
    const multipart = require('connect-multiparty')

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
    app.use(express.query())

    app.use(express.json({ limit }))
    app.use(express.urlencoded({ limit, parameterLimit: paramLimit, extended: true }))
    // replacement for deprecated express.multipart/connect.multipart
    // limit to 100mb, as per the old behavior
    app.use(multipart({ maxFilesSize: 100 * 1024 * 1024 }))

    if (stat) {
      app.use(express.static(stat))
    }
    const p = new Promise((resolve, reject) => {
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
    return p
  }

  // Setup an empty router object
  //
  // returns nothing
  setupNullRouter () {
    const msg = 'A script has tried registering a HTTP route while the HTTP server is disabled with --disabled-httpd.'

    this.router = {
      get: () => this.logger.warning(msg),
      post: () => this.logger.warning(msg),
      put: () => this.logger.warning(msg),
      delete: () => this.logger.warning(msg)
    }
  }

  // Load the adapter Hubot is going to use.
  //
  // path    - A String of the path to adapter if local.
  // adapter - A String of the adapter name to use.
  //
  // Returns nothing.
  async loadAdapter (adapterPath = null) {
    this.logger.debug(`Loading adapter ${adapterPath ?? 'from npmjs:'} ${this.adapterName}`)
    const ext = path.extname(adapterPath ?? '') ?? '.js'
    try {
      if (Array.from(HUBOT_DEFAULT_ADAPTERS).indexOf(this.adapterName) > -1) {
        this.adapter = this.requireAdapterFrom(path.resolve(path.join(__dirname, 'adapters', this.adapterName)))
      } else if (['.js', '.cjs', '.coffee'].includes(ext)) {
        this.adapter = this.requireAdapterFrom(path.resolve(adapterPath))
      } else if (['.mjs'].includes(ext)) {
        this.adapter = await this.importAdapterFrom(pathToFileURL(path.resolve(adapterPath)).href)
      } else {
        const adapterPathInCurrentWorkingDirectory = this.adapterName
        try {
          this.adapter = this.requireAdapterFrom(adapterPathInCurrentWorkingDirectory)
        } catch (err) {
          if (err.name === 'SyntaxError') {
            this.adapter = await this.importAdapterFrom(adapterPathInCurrentWorkingDirectory)
          } else {
            throw err
          }
        }
      }
    } catch (error) {
      this.logger.error(`Cannot load adapter ${adapterPath ?? '[no path set]'} ${this.adapterName} - ${error}`)
      throw error
    }
  }

  requireAdapterFrom (adapaterPath) {
    return require(adapaterPath).use(this)
  }

  async importAdapterFrom (adapterPath) {
    return await (await import(adapterPath)).default.use(this)
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
  parseHelp (path) {
    const scriptDocumentation = {}
    const body = fs.readFileSync(require.resolve(path), 'utf-8')

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
    this.emit('running')

    return await this.adapter.run()
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

  // Public: The version of Hubot from npm
  //
  // Returns a String of the version number.
  parseVersion () {
    const pkg = require(path.join(__dirname, '..', 'package.json'))
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

module.exports = Robot

function isCatchAllMessage (message) {
  return message instanceof Message.CatchAllMessage
}

function toHeaderCommentBlock (block, currentLine) {
  if (!block.isHeader) {
    return block
  }

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
