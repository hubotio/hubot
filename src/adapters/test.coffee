Robot = require '../robot'
Adapter = require '../adapter'
Message = require '../message'

class Test extends Adapter
  run: ->
    @sent = []
    @emit 'connected'

  send: (envelope, strings...) ->
    console.log "test.send #{require('util').inspect envelop, strings}"
    @sent.push string for string in strings

exports.use = (robot) ->
  new Test robot
