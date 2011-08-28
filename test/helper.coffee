Robot = require '../src/robot'

# A programmer's best friend.
# http://timenerdworld.files.wordpress.com/2010/12/joint-venture-s1e3_1.jpg
class Helper extends Robot
  constructor: (path) ->
    super path
    @sent = []

  send: (user, strings...) ->
    strings.forEach (str) =>
      @sent.push str
    @cb?()

  reply: (user, strings...) ->
    strings.forEach (str) =>
      @send user, "#{user.name}: #{str}"

  # modified to accept a string and pass the Robot.Message to super()
  receive: (text) ->
    user = new Robot.User 1, 'helper'
    super new Robot.Message(user, text)

module.exports = ->
  new Helper "#{__dirname}/scripts"
