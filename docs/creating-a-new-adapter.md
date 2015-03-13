# Adapter Basics

All adapters inherit from the Adapter class in the `src/adapter.coffee` file.  There are certain methods that you will want to override.  Here is a basic stub of what an extended Adapter class would look like:

```coffee
class Bunny extends Adapter

  constructor: ->
    @robot.logger.info "Constructor"
    super
    

  send: (envelope, strings...) ->
    @robot.logger.info "Send"

  reply: (envelope, strings...) ->
    @robot.logger.info "Reply"

  run: ->
    @robot.logger.info "Run"
    @emit "connected"


exports.use = (robot) ->
  new Bunny robot
```
