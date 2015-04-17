class Hook
  constructor: (opts) ->
    @context =
      response: opts.response
      listener: opts.listener
      message:  opts.message
      robot:    opts.robot
      reply:    opts.reply
      finish:   @finish
      next:     @next
    @hooks    = opts.hooks.slice 0 # make a shallow clone
    @callback = opts.callback

  run: ->
    nextHook = @hooks.shift()
    if nextHook?
      nextHook(@context)
    else
      @callback()

  finish: =>
    if @context.reply
      # We're processing a reply, not a listen or receive. The message has
      # been processed, so it's too late to finish() it. By not calling
      # @run() or @callback() we end processing and do not send the reply.
    else
      @context.message.finish()
      @callback()

  next: =>
    @run()

module.exports = {
  Hook
}
