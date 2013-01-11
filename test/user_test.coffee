User = require '../src/user'

module.exports = {

  'create a user': (test) ->
    user = new User 'Fake User',
      name: 'fake'
      type: 'groupchat'

    test.ok 'Fake User' is user.id
    test.ok 'fake' is user.name
    test.ok 'groupchat' is user.type
    test.done()

  'create a user without name defaults to ID as name': (test) ->
    user = new User 'Fake User',
      room: 'chat@room.jabber'
      type: 'groupchat'

    test.ok 'Fake User' is user.id
    test.ok 'Fake User' is user.name
    test.ok 'groupchat' is user.type
    test.ok 'chat@room.jabber' is user.room
    test.done()

}
