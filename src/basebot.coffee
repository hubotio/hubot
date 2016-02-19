Log            = require 'log'
{EventEmitter} = require 'events'
async          = require 'async'

User = require './user'
Brain = require './brain'
Response = require './response'
{Listener,TextListener} = require './listener'
{EnterMessage,LeaveMessage,TopicMessage,CatchAllMessage} = require './message'
Middleware = require './middleware'

class Basebot
  # Robots receive messages from a chat source (Campfire, irc, etc), and
  # dispatch them to matching listeners.
  #
  # adapter     - A String of the adapter name.
  # name        - A String of the robot name, defaults to Hubot.
  #
  # Returns nothing.
  constructor: (name = 'Hubot', alias = false) ->
    @name       = name
    @events     = new EventEmitter
    @brain      = new Brain @
    @alias      = alias
    @adapter    = null
    @Response   = Response
    @commands   = []
    @listeners  = []
    @middleware =
      listener: new Middleware(@)
      response: new Middleware(@)
      receive:  new Middleware(@)
    @logger     = new Log process.env.HUBOT_LOG_LEVEL or 'info'
    @pingIntervalId = null
    @globalHttpOptions = {}

    @setupRouter(@nullRouter())
    @setupHTTP(@nullHTTP())

    @errorHandlers = []

    @on 'error', (err, res) =>
      @invokeErrorHandlers(err, res)
    @onUncaughtException = (err) =>
      @emit 'error', err
    process.on 'uncaughtException', @onUncaughtException

  loadScript: (script) ->
    script @

  # Public: Adds a custom Listener with the provided matcher, options, and
  # callback
  #
  # matcher  - A Function that determines whether to call the callback.
  #            Expected to return a truthy value if the callback should be
  #            executed.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object if the
  #            matcher function returns true.
  #
  # Returns nothing.
  listen: (matcher, options, callback) ->
    @listeners.push new Listener(@, matcher, options, callback)

  # Public: Adds a Listener that attempts to match incoming messages based on
  # a Regex.
  #
  # regex    - A Regex that determines if the callback should be called.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  hear: (regex, options, callback) ->
    @listeners.push new TextListener(@, regex, options, callback)

  # Public: Adds a Listener that attempts to match incoming messages directed
  # at the robot based on a Regex. All regexes treat patterns like they begin
  # with a '^'
  #
  # regex    - A Regex that determines if the callback should be called.
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  respond: (regex, options, callback) ->
    @hear(@respondPattern(regex), options, callback)

  # Public: Build a regular expression that matches messages addressed
  # directly to the robot
  #
  # regex - A RegExp for the message part that follows the robot's name/alias
  #
  # Returns RegExp.
  respondPattern: (regex) ->
    re = regex.toString().split('/')
    re.shift()
    modifiers = re.pop()

    if re[0] and re[0][0] is '^'
      @logger.warning \
        "Anchors don't work well with respond, perhaps you want to use 'hear'"
      @logger.warning "The regex in question was #{regex.toString()}"

    pattern = re.join('/')
    name = @name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

    if @alias
      alias = @alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      [a,b] = if name.length > alias.length then [name,alias] else [alias,name]
      newRegex = new RegExp(
        "^\\s*[@]?(?:#{a}[:,]?|#{b}[:,]?)\\s*(?:#{pattern})"
        modifiers
      )
    else
      newRegex = new RegExp(
        "^\\s*[@]?#{name}[:,]?\\s*(?:#{pattern})",
        modifiers
      )

    newRegex

  # Public: Adds a Listener that triggers when anyone enters the room.
  #
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  enter: (options, callback) ->
    @listen(
      ((msg) -> msg instanceof EnterMessage)
      options
      callback
    )

  # Public: Adds a Listener that triggers when anyone leaves the room.
  #
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  leave: (options, callback) ->
    @listen(
      ((msg) -> msg instanceof LeaveMessage)
      options
      callback
    )

  # Public: Adds a Listener that triggers when anyone changes the topic.
  #
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  topic: (options, callback) ->
    @listen(
      ((msg) -> msg instanceof TopicMessage)
      options
      callback
    )

  # Public: Adds an error handler when an uncaught exception or user emitted
  # error event occurs.
  #
  # callback - A Function that is called with the error object.
  #
  # Returns nothing.
  error: (callback) ->
    @errorHandlers.push callback

  # Calls and passes any registered error handlers for unhandled exceptions or
  # user emitted error events.
  #
  # err - An Error object.
  # res - An optional Response object that generated the error
  #
  # Returns nothing.
  invokeErrorHandlers: (err, res) ->
    @logger.error err.stack
    for errorHandler in @errorHandlers
     try
       errorHandler(err, res)
     catch errErr
       @logger.error "while invoking error handler: #{errErr}\n#{errErr.stack}"

  # Public: Adds a Listener that triggers when no other text matchers match.
  #
  # options  - An Object of additional parameters keyed on extension name
  #            (optional).
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  catchAll: (options, callback) ->
    # `options` is optional; need to isolate the real callback before
    # wrapping it with logic below
    if not callback?
      callback = options
      options = {}

    @listen(
      ((msg) -> msg instanceof CatchAllMessage)
      options
      ((msg) -> msg.message = msg.message.message; callback msg)
    )

  # Public: Registers new middleware for execution after matching but before
  # Listener callbacks
  #
  # middleware - A function that determines whether or not a given matching
  #              Listener should be executed. The function is called with
  #              (context, next, done). If execution should
  #              continue (next middleware, Listener callback), the middleware
  #              should call the 'next' function with 'done' as an argument.
  #              If not, the middleware should call the 'done' function with
  #              no arguments.
  #
  # Returns nothing.
  listenerMiddleware: (middleware) ->
    @middleware.listener.register middleware
    return undefined

  # Public: Registers new middleware for execution as a response to any
  # message is being sent.
  #
  # middleware - A function that examines an outgoing message and can modify
  #              it or prevent its sending. The function is called with
  #              (context, next, done). If execution should continue,
  #              the middleware should call next(done). If execution should stop,
  #              the middleware should call done(). To modify the outgoing message,
  #              set context.string to a new message.
  #
  # Returns nothing.
  responseMiddleware: (middleware) ->
    @middleware.response.register middleware
    return undefined

  # Public: Registers new middleware for execution before matching
  #
  # middleware - A function that determines whether or not listeners should be
  #              checked. The function is called with (context, next, done). If
  #              ext, next, done). If execution should continue to the next
  #              middleware or matching phase, it should call the 'next'
  #              function with 'done' as an argument. If not, the middleware
  #              should call the 'done' function with no arguments.
  #
  # Returns nothing.
  receiveMiddleware: (middleware) ->
    @middleware.receive.register middleware
    return undefined

  # Public: Passes the given message to any interested Listeners after running
  #         receive middleware.
  #
  # message - A Message instance. Listeners can flag this message as 'done' to
  #           prevent further execution.
  #
  # cb - Optional callback that is called when message processing is complete
  #
  # Returns nothing.
  # Returns before executing callback
  receive: (message, cb) ->
    # When everything is finished (down the middleware stack and back up),
    # pass control back to the robot
    @middleware.receive.execute(
      {response: new Response(this, message)}
      @processListeners.bind this
      cb
    )

  # Private: Passes the given message to any interested Listeners.
  #
  # message - A Message instance. Listeners can flag this message as 'done' to
  #           prevent further execution.
  #
  # done - Optional callback that is called when message processing is complete
  #
  # Returns nothing.
  # Returns before executing callback
  processListeners: (context, done) ->
    # Try executing all registered Listeners in order of registration
    # and return after message is done being processed
    anyListenersExecuted = false
    async.detectSeries(
      @listeners,
      (listener, cb) =>
        try
          listener.call context.response.message, @middleware.listener, (listenerExecuted) ->
            anyListenersExecuted = anyListenersExecuted || listenerExecuted
            # Defer to the event loop at least after every listener so the
            # stack doesn't get too big
            Middleware.ticker () ->
              # Stop processing when message.done == true
              cb(context.response.message.done)
        catch err
          @emit('error', err, new @Response(@, context.response.message, []))
          # Continue to next listener when there is an error
          cb(false)
      ,
      # Ignore the result ( == the listener that set message.done = true)
      (_) =>
        # If no registered Listener matched the message
        if context.response.message not instanceof CatchAllMessage and not anyListenersExecuted
          @logger.debug 'No listeners executed; falling back to catch-all'
          @receive new CatchAllMessage(context.response.message), done
        else
          process.nextTick done if done?
    )
    return undefined

  setupRouter: (router) ->
    @router = router

  # Setup an empty router object
  #
  # returns nothing
  nullRouter: ->
    msg = "A script has tried registering a HTTP route while the HTTP server is disabled with --disabled-httpd."

    return {
      get: ()=> @logger.warning msg
      post: ()=> @logger.warning msg
      put: ()=> @logger.warning msg
      delete: ()=> @logger.warning msg
    }

  setupHTTP: (httpClient) ->
    @http = httpClient

  nullHTTP: ->
    msg = "A script has tried making a HTTP request while the HTTP client has not been initialized."
    return -> {
      query: ()=> @logger.warning msg; ->
      header: ()=> @logger.warning msg; ->
      headers: ()=> @logger.warning msg; ->
      get: ()=> @logger.warning msg; ->
      post: ()=> @logger.warning msg; ->
      put: ()=> @logger.warning msg; ->
      delete: ()=> @logger.warning msg; ->
    }


  # Load the adapter Hubot is going to use.
  #
  # path    - A String of the path to adapter if local.
  # adapter - A String of the adapter name to use.
  #
  # Returns nothing.
  loadAdapter: (adapter) ->
    @logger.debug "Loading adapter #{adapter}"
    @adapter = adapter.use @


  # Public: A helper send function which delegates to the adapter's send
  # function.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  send: (user, strings...) ->
    @adapter.send user, strings...

  # Public: A helper reply function which delegates to the adapter's reply
  # function.
  #
  # user    - A User instance.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  reply: (user, strings...) ->
    @adapter.reply user, strings...

  # Public: A helper send function to message a room that the robot is in.
  #
  # room    - String designating the room to message.
  # strings - One or more Strings for each message to send.
  #
  # Returns nothing.
  messageRoom: (room, strings...) ->
    user = { room: room }
    @adapter.send user, strings...

  # Public: A wrapper around the EventEmitter API to make usage
  # semantically better.
  #
  # event    - The event name.
  # listener - A Function that is called with the event parameter
  #            when event happens.
  #
  # Returns nothing.
  on: (event, args...) ->
    @events.on event, args...

  # Public: A wrapper around the EventEmitter API to make usage
  # semantically better.
  #
  # event   - The event name.
  # args...  - Arguments emitted by the event
  #
  # Returns nothing.
  emit: (event, args...) ->
    @events.emit event, args...

  # Public: Kick off the event loop for the adapter
  #
  # Returns nothing.
  run: ->
    @emit "running"
    @adapter.run()

  # Public: Gracefully shutdown the robot process
  #
  # Returns nothing.
  shutdown: ->
    clearInterval @pingIntervalId if @pingIntervalId?
    process.removeListener 'uncaughtException', @onUncaughtException
    @adapter.close()
    @brain.close()

  # Private: Extend obj with objects passed as additional args.
  #
  # Returns the original object with updated changes.
  extend: (obj, sources...) ->
    for source in sources
      obj[key] = value for own key, value of source
    obj


module.exports = Basebot
