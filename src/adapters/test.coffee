Robot         = require '../robot'
Adapter       = require '../adapter'
{TextMessage} = require '../message'

class Test extends Adapter
  send: (envelope, strings...) ->
    for str in strings
      @history.push str

  reply: (envelope, strings...) ->
    strings = strings.map (s) -> "#{envelope.user.name}: #{s}"
    @send envelope, strings...

  receiveText: (input) ->
    user = @robot.brain.userForId '1', name: 'test', room: 'Test'
    textMessage = new TextMessage user, input, 'messageId'
    @receive textMessage

  run: ->
    self = @
    @history = [ ]
    self.emit 'connected'

exports.use = (robot) ->
  new Test robot
