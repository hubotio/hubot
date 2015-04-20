class Hook
  constructor: (opts) ->
    @response = opts.response
    @robot    = opts.robot
    @listener = opts.listener
    @message  = opts.message
    @response ||= new @robot.Response(@robot, @message)

    @reply    = opts.reply # An object like { text: "string" }

    @hooks    = opts.hooks
    @callback = opts.callback
    @nextHook = -1

  run: ->
    for hook in @hooks
      hook(@)
      return if @finished?
    @callback(@reply.text if @reply?)

  finish: =>
    @finished = true
    if @reply?
      # We're processing a reply, not a listen or receive. The message has
      # been processed, so it's too late to finish() it. By not calling
      # @run() or @callback() we end processing and do not send the reply.
      # if they reply has been updated, we note that by returning the new value.
      @reply.text
    else
      @message.finish()
      @callback()

module.exports = {
  Hook
}
