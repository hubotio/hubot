{expect} = require 'chai'
Message = require '../src/message.coffee'

describe "Message", ->

  it "knows its user and room", ->
    room = 123
    user = {room: room}
    message = new Message 'text', user: user

    expect(message.user).to.equal(user)
    expect(message.room).to.equal(room)

  it "knows its text", ->
    text = "omgwtfbbq"
    message = new Message 'text', user: {room: 123}, text: text

    expect(message.text).to.equal(text)

  it "knows its id", ->
    message = new Message 'text', id: 1337

    expect(message.id).to.equal(1337)

  it "is finishable", ->
    message = new Message 'text'

    expect(message.done).to.be.false
    message.finish()
    expect(message.done).to.be.true

  it "matches text message  when the text matches the regex", ->
    message = new Message 'text', text: "omgwtfbbq"

    expect(message.match(/omg/)).to.be.ok

  it "doesn't match text message  when the text doesn't matches the regex", ->
    message = new Message 'text', text: "omgwtfbbq"

    expect(message.match(/lol/)).to.not.be.ok
