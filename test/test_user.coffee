assert = require 'assert'

User = require '../src/user'

user = new User "Fake User", {name: 'fake', type: "groupchat"}
assert.equal "Fake User", user.id
assert.equal "groupchat", user.type
assert.equal "fake", user.name

user = new User "Fake User", {room: "chat@room.jabber", type: "groupchat"}
assert.equal "Fake User", user.id
assert.equal "chat@room.jabber", user.room
assert.equal "groupchat", user.type
assert.equal "Fake User", user.name # Make sure that if no name is given, we fallback to the ID
