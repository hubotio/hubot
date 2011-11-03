Robot = require '../robot'

class Cli extends Robot
  send: (user, strings...) ->
    console.log str for str in strings
    @finish()

  reply: (user, strings...) ->
    @send user, "#{user.name}: #{str}" for str in strings

  finish: ->
    clearTimeout @imminentDeath
    @imminentDeath = setTimeout (-> process.exit 0), 10

  noMatch: (message) ->
    @warn "nothing matched \"#{message.text}\""
    process.exit 1

  run: (cmd) ->
    command = "#{@name}: " + cmd.join(' ')
    user = @userForId('1', {name: process.env.USER})
    @receive new Robot.TextMessage user, command

module.exports = Cli
