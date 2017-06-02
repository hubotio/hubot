'use strict'

var _slicedToArray = (function () { function sliceIterator (arr, i) { var _arr = []; var _n = true; var _d = false; var _e; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break } } catch (err) { _d = true; _e = err } finally { try { if (!_n && _i['return']) _i['return']() } finally { if (_d) throw _e } } return _arr } return function (arr, i) { if (Array.isArray(arr)) { return arr } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i) } else { throw new TypeError('Invalid attempt to destructure non-iterable instance') } } }())

const Fs = require('fs')
const Log = require('log')
const Path = require('path')
const HttpClient = require('scoped-http-client')

var _require = require('events')

const EventEmitter = _require.EventEmitter

const async = require('async')

const User = require('./user')
const Brain = require('./brain')
const Response = require('./response')

var _require2 = require('./listener')

const Listener = _require2.Listener,
  TextListener = _require2.TextListener

var _require3 = require('./message')

const EnterMessage = _require3.EnterMessage,
  LeaveMessage = _require3.LeaveMessage,
  TopicMessage = _require3.TopicMessage,
  CatchAllMessage = _require3.CatchAllMessage

const Middleware = require('./middleware')

const HUBOT_DEFAULT_ADAPTERS = ['campfire', 'shell']

const HUBOT_DOCUMENTATION_SECTIONS = ['description', 'dependencies', 'configuration', 'commands', 'notes', 'author', 'authors', 'examples', 'tags', 'urls']

class Robot {
  // Robots receive messages from a chat source (Campfire, irc, etc), and
  // dispatch them to matching listeners.
  //
  // adapterPath -  A String of the path to built-in adapters (defaults to src/adapters)
  // adapter     - A String of the adapter name.
  // httpd       - A Boolean whether to enable the HTTP daemon.
  // name        - A String of the robot name, defaults to Hubot.
  //
  // Returns nothing.
  constructor (adapterPath, adapter, httpd, name, alias) {
    if (name == null) {
      name = 'Hubot'
    }
    if (alias == null) {
      alias = false
    }
    if (this.adapterPath == null) {
      this.adapterPath = Path.join(__dirname, 'adapters')
    }

    this.name = name
    this.events = new EventEmitter()
    this.brain = new Brain(this)
    this.alias = alias
    this.adapter = null
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
    if (httpd) {
      this.setupExpress()
    } else {
      this.setupNullRouter()
    }

    this.loadAdapter(adapter)

    this.adapterName = adapter
    this.errorHandlers = []

    this.on('error', (err, res) => {
      return this.invokeErrorHandlers(err, res)
    })
    this.onUncaughtException = err => {
      return this.emit('error', err)
    }
    process.on('uncaughtException', this.onUncaughtException)
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
    return this.listeners.push(new Listener(this, matcher, options, callback))
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
    return this.listeners.push(new TextListener(this, regex, options, callback))
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
    return this.hear(this.respondPattern(regex), options, callback)
  }

  // Public: Build a regular expression that matches messages addressed
  // directly to the robot
  //
  // regex - A RegExp for the message part that follows the robot's name/alias
  //
  // Returns RegExp.
  respondPattern (regex) {
    let newRegex
    const re = regex.toString().split('/')
    re.shift()
    const modifiers = re.pop()

    if (re[0] && re[0][0] === '^') {
      this.logger.warning("Anchors don't work well with respond, perhaps you want to use 'hear'")
      this.logger.warning(`The regex in question was ${regex.toString()}`)
    }

    const pattern = re.join('/')
    const name = this.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

    if (this.alias) {
      const alias = this.alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

      var _Array$from = Array.from(name.length > alias.length ? [name, alias] : [alias, name]),
        _Array$from2 = _slicedToArray(_Array$from, 2)

      const a = _Array$from2[0],
        b = _Array$from2[1]

      newRegex = new RegExp(`^\\s*[@]?(?:${a}[:,]?|${b}[:,]?)\\s*(?:${pattern})`, modifiers)
    } else {
      newRegex = new RegExp(`^\\s*[@]?${name}[:,]?\\s*(?:${pattern})`, modifiers)
    }

    return newRegex
  }

  // Public: Adds a Listener that triggers when anyone enters the room.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  enter (options, callback) {
    return this.listen(msg => msg instanceof EnterMessage, options, callback)
  }

  // Public: Adds a Listener that triggers when anyone leaves the room.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  leave (options, callback) {
    return this.listen(msg => msg instanceof LeaveMessage, options, callback)
  }

  // Public: Adds a Listener that triggers when anyone changes the topic.
  //
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is called with a Response object.
  //
  // Returns nothing.
  topic (options, callback) {
    return this.listen(msg => msg instanceof TopicMessage, options, callback)
  }

  // Public: Adds an error handler when an uncaught exception or user emitted
  // error event occurs.
  //
  // callback - A Function that is called with the error object.
  //
  // Returns nothing.
  error (callback) {
    return this.errorHandlers.push(callback)
  }

  // Calls and passes any registered error handlers for unhandled exceptions or
  // user emitted error events.
  //
  // err - An Error object.
  // res - An optional Response object that generated the error
  //
  // Returns nothing.
  invokeErrorHandlers (err, res) {
    this.logger.error(err.stack)
    return Array.from(this.errorHandlers).map(errorHandler => (() => {
      try {
        return errorHandler(err, res)
      } catch (errErr) {
        return this.logger.error(`while invoking error handler: ${errErr}\n${errErr.stack}`)
      }
    })())
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
    return undefined
  }

  // Public: Registers new middleware for execution as a response to any
  // message is being sent.
  //
  // middleware - A function that examines an outgoing message and can modify
  //              it or prevent its sending. The function is called with
  //              (context, next, done). If execution should continue,
  //              the middleware should call next(done). If execution should stop,
  //              the middleware should call done(). To modify the outgoing message,
  //              set context.string to a new message.
  //
  // Returns nothing.
  responseMiddleware (middleware) {
    this.middleware.response.register(middleware)
    return undefined
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
    return undefined
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
  receive (message, cb) {
    // When everything is finished (down the middleware stack and back up),
    // pass control back to the robot
    return this.middleware.receive.execute({ response: new Response(this, message) }, this.processListeners.bind(this), cb)
  }

  // Private: Passes the given message to any interested Listeners.
  //
  // message - A Message instance. Listeners can flag this message as 'done' to
  //           prevent further execution.
  //
  // done - Optional callback that is called when message processing is complete
  //
  // Returns nothing.
  // Returns before executing callback
  processListeners (context, done) {
    // Try executing all registered Listeners in order of registration
    // and return after message is done being processed
    let anyListenersExecuted = false

    async.detectSeries(this.listeners, (listener, cb) => {
      try {
        return listener.call(context.response.message, this.middleware.listener, function (listenerExecuted) {
          anyListenersExecuted = anyListenersExecuted || listenerExecuted
          // Defer to the event loop at least after every listener so the
          // stack doesn't get too big
          return Middleware.ticker(() =>
          // Stop processing when message.done == true
          cb(context.response.message.done))
        })
      } catch (err) {
        this.emit('error', err, new this.Response(this, context.response.message, []))
        // Continue to next listener when there is an error
        return cb(false)
      }
    },
    // Ignore the result ( == the listener that set message.done = true)
    _ => {
      // If no registered Listener matched the message

      if (!(context.response.message instanceof CatchAllMessage) && !anyListenersExecuted) {
        this.logger.debug('No listeners executed; falling back to catch-all')
        return this.receive(new CatchAllMessage(context.response.message), done)
      } else {
        if (done != null) {
          return process.nextTick(done)
        }
      }
    })
    return undefined
  }

  // Public: Loads a file in path.
  //
  // path - A String path on the filesystem.
  // file - A String filename in path on the filesystem.
  //
  // Returns nothing.
  loadFile (path, file) {
    const ext = Path.extname(file)
    const full = Path.join(path, Path.basename(file, ext))
    if (require.extensions[ext]) {
      try {
        const script = require(full)

        if (typeof script === 'function') {
          script(this)
          return this.parseHelp(Path.join(path, file))
        } else {
          return this.logger.warning(`Expected ${full} to assign a function to module.exports, got ${typeof script}`)
        }
      } catch (error) {
        this.logger.error(`Unable to load ${full}: ${error.stack}`)
        return process.exit(1)
      }
    }
  }

  // Public: Loads every script in the given path.
  //
  // path - A String path on the filesystem.
  //
  // Returns nothing.
  load (path) {
    this.logger.debug(`Loading scripts from ${path}`)

    if (Fs.existsSync(path)) {
      return Array.from(Fs.readdirSync(path).sort()).map(file => this.loadFile(path, file))
    }
  }

  // Public: Load scripts specified in the `hubot-scripts.json` file.
  //
  // path    - A String path to the hubot-scripts files.
  // scripts - An Array of scripts to load.
  //
  // Returns nothing.
  loadHubotScripts (path, scripts) {
    this.logger.debug(`Loading hubot-scripts from ${path}`)
    return Array.from(scripts).map(script => this.loadFile(path, script))
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
      let pkg
      if (packages instanceof Array) {
        return (() => {
          const result = []
          var _iteratorNormalCompletion = true
          var _didIteratorError = false
          var _iteratorError

          try {
            for (var _iterator = Array.from(packages)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              pkg = _step.value

              result.push(require(pkg)(this))
            }
          } catch (err) {
            _didIteratorError = true
            _iteratorError = err
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return()
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError
              }
            }
          }

          return result
        })()
      } else {
        return (() => {
          const result1 = []
          for (pkg in packages) {
            const scripts = packages[pkg]
            result1.push(require(pkg)(this, scripts))
          }
          return result1
        })()
      }
    } catch (err) {
      this.logger.error(`Error loading scripts from npm package - ${err.stack}`)
      return process.exit(1)
    }
  }

  // Setup the Express server's defaults.
  //
  // Returns nothing.
  setupExpress () {
    const user = process.env.EXPRESS_USER
    const pass = process.env.EXPRESS_PASSWORD
    const stat = process.env.EXPRESS_STATIC
    const port = process.env.EXPRESS_PORT || process.env.PORT || 8080
    const address = process.env.EXPRESS_BIND_ADDRESS || process.env.BIND_ADDRESS || '0.0.0.0'
    const limit = process.env.EXPRESS_LIMIT || '100kb'
    const paramLimit = parseInt(process.env.EXPRESS_PARAMETER_LIMIT) || 1000

    const express = require('express')
    const multipart = require('connect-multiparty')

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
    app.use(express.urlencoded({ limit, parameterLimit: paramLimit }))
    // replacement for deprecated express.multipart/connect.multipart
    // limit to 100mb, as per the old behavior
    app.use(multipart({ maxFilesSize: 100 * 1024 * 1024 }))

    if (stat) {
      app.use(express.static(stat))
    }

    try {
      this.server = app.listen(port, address)
      this.router = app
    } catch (error) {
      const err = error
      this.logger.error(`Error trying to start HTTP server: ${err}\n${err.stack}`)
      process.exit(1)
    }

    let herokuUrl = process.env.HEROKU_URL

    if (herokuUrl) {
      if (!/\/$/.test(herokuUrl)) {
        herokuUrl += '/'
      }
      return this.pingIntervalId = setInterval(() => {
        return HttpClient.create(`${herokuUrl}hubot/ping`).post()((err, res, body) => {
          return this.logger.info('keep alive ping!')
        })
      }, 5 * 60 * 1000)
    }
  }

  // Setup an empty router object
  //
  // returns nothing
  setupNullRouter () {
    const msg = 'A script has tried registering a HTTP route while the HTTP server is disabled with --disabled-httpd.'
    return this.router = {
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
  loadAdapter (adapter) {
    this.logger.debug(`Loading adapter ${adapter}`)

    try {
      const path = Array.from(HUBOT_DEFAULT_ADAPTERS).includes(adapter) ? `${this.adapterPath}/${adapter}` : `hubot-${adapter}`

      return this.adapter = require(path).use(this)
    } catch (err) {
      this.logger.error(`Cannot load adapter ${adapter} - ${err}`)
      return process.exit(1)
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
  parseHelp (path) {
    let cleanedLine
    this.logger.debug(`Parsing help for ${path}`)
    const scriptName = Path.basename(path).replace(/\.(coffee|js)$/, '')
    const scriptDocumentation = {}

    const body = Fs.readFileSync(path, 'utf-8')

    let currentSection = null
    var _iteratorNormalCompletion2 = true
    var _didIteratorError2 = false
    var _iteratorError2

    try {
      for (var _iterator2 = Array.from(body.split('\n'))[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var line = _step2.value

        if (line[0] !== '#' && line.substr(0, 2) !== '//') {
          break
        }

        cleanedLine = line.replace(/^(#|\/\/)\s?/, '').trim()

        if (cleanedLine.length === 0) {
          continue
        }
        if (cleanedLine.toLowerCase() === 'none') {
          continue
        }

        const nextSection = cleanedLine.toLowerCase().replace(':', '')
        if (Array.from(HUBOT_DOCUMENTATION_SECTIONS).includes(nextSection)) {
          currentSection = nextSection
          scriptDocumentation[currentSection] = []
        } else {
          if (currentSection) {
            scriptDocumentation[currentSection].push(cleanedLine.trim())
            if (currentSection === 'commands') {
              this.commands.push(cleanedLine.trim())
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError2 = true
      _iteratorError2 = err
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return()
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2
        }
      }
    }

    if (currentSection === null) {
      this.logger.info(`${path} is using deprecated documentation syntax`)
      scriptDocumentation.commands = []
      return (() => {
        const result = []
        var _iteratorNormalCompletion3 = true
        var _didIteratorError3 = false
        var _iteratorError3

        try {
          for (var _iterator3 = Array.from(body.split('\n'))[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            line = _step3.value

            if (!(line[0] === '#' || line.substr(0, 2) === '//')) {
              break
            }
            if (!line.match('-')) {
              continue
            }
            cleanedLine = line.slice(2, +line.length + 1 || undefined).replace(/^hubot/i, this.name).trim()
            scriptDocumentation.commands.push(cleanedLine)
            result.push(this.commands.push(cleanedLine))
          }
        } catch (err) {
          _didIteratorError3 = true
          _iteratorError3 = err
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return()
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3
            }
          }
        }

        return result
      })()
    }
  }

  // Public: A helper send function which delegates to the adapter's send
  // function.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns nothing.
  send (envelope, ...strings) {
    return this.adapter.send(envelope, ...Array.from(strings))
  }

  // Public: A helper reply function which delegates to the adapter's reply
  // function.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns nothing.
  reply (envelope, ...strings) {
    return this.adapter.reply(envelope, ...Array.from(strings))
  }

  // Public: A helper send function to message a room that the robot is in.
  //
  // room    - String designating the room to message.
  // strings - One or more Strings for each message to send.
  //
  // Returns nothing.
  messageRoom (room, ...strings) {
    const envelope = { room }
    return this.adapter.send(envelope, ...Array.from(strings))
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
    return this.events.on(event, ...Array.from(args))
  }

  // Public: A wrapper around the EventEmitter API to make usage
  // semantically better.
  //
  // event   - The event name.
  // args...  - Arguments emitted by the event
  //
  // Returns nothing.
  emit (event, ...args) {
    return this.events.emit(event, ...Array.from(args))
  }

  // Public: Kick off the event loop for the adapter
  //
  // Returns nothing.
  run () {
    this.emit('running')
    return this.adapter.run()
  }

  // Public: Gracefully shutdown the robot process
  //
  // Returns nothing.
  shutdown () {
    if (this.pingIntervalId != null) {
      clearInterval(this.pingIntervalId)
    }
    process.removeListener('uncaughtException', this.onUncaughtException)
    this.adapter.close()
    if (this.server) {
      this.server.close()
    }
    return this.brain.close()
  }

  // Public: The version of Hubot from npm
  //
  // Returns a String of the version number.
  parseVersion () {
    const pkg = require(Path.join(__dirname, '..', 'package.json'))
    return this.version = pkg.version
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
    return HttpClient.create(url, this.extend({}, this.globalHttpOptions, options)).header('User-Agent', `Hubot/${this.version}`)
  }

  // Private: Extend obj with objects passed as additional args.
  //
  // Returns the original object with updated changes.
  extend (obj, ...sources) {
    var _iteratorNormalCompletion4 = true
    var _didIteratorError4 = false
    var _iteratorError4

    try {
      for (var _iterator4 = Array.from(sources)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        let source = _step4.value
        var _iteratorNormalCompletion5 = true
        var _didIteratorError5 = false
        var _iteratorError5

        try {
          for (var _iterator5 = Object.keys(source || {})[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            let key = _step5.value
            const value = source[key]; obj[key] = value
          }
        } catch (err) {
          _didIteratorError5 = true
          _iteratorError5 = err
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return()
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError4 = true
      _iteratorError4 = err
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return()
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4
        }
      }
    }

    return obj
  }
}

module.exports = Robot

function isCatchAllMessage (message) {
  return message instanceof CatchAllMessage
}
