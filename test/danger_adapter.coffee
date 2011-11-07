Robot = require '../src/robot'

class Danger extends Robot.Adapter
  send: (user, strings...) ->
    strings.forEach (str) =>
      @sent.push str
    @cb? strings...

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{@name}: #{str}"

  run: ->
    console.log "Hubot: The Danger Room."

  receive: (text) ->
    user = new Robot.User 1, 'helper'
    super new Robot.TextMessage user, text

module.exports = Danger

