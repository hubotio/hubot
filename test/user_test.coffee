User = require '../src/user'

suite =

  'can create a user': (test) ->
    user = new User 1
    test.ok user
    test.ok user.id is 1
    test.done()

  'can create a user with optional key value pairs': (test) ->
    user = new User 1, location: 'San Francisco'
    test.ok user
    test.ok user.location is 'San Francisco'
    test.done()

  'can create a user with a name': (test) ->
    user = new User 1, name: 'Hubot'
    test.ok user
    test.ok user.name is 'Hubot'
    test.done()

  'can create a user without a name, defaults name to id': (test) ->
    user = new User 1
    test.ok user
    test.ok user.name is user.id
    test.done()

module.exports = suite
