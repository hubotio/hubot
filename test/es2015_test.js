'use strict'

/* eslint-disable no-unused-expressions */

const { describe, it } = require('node:test')
const assert = require('assert/strict')

const { hook, reset } = require('./fixtures/RequireMocker.js')

// Hubot classes
const Hubot = require('../es2015.js')
const User = Hubot.User
const Brain = Hubot.Brain
const Robot = Hubot.Robot
const Adapter = Hubot.Adapter
const Response = Hubot.Response
const Listener = Hubot.Listener
const TextListener = Hubot.TextListener
const Message = Hubot.Message
const TextMessage = Hubot.TextMessage
const EnterMessage = Hubot.EnterMessage
const LeaveMessage = Hubot.LeaveMessage
const TopicMessage = Hubot.TopicMessage
const CatchAllMessage = Hubot.CatchAllMessage

describe('hubot/es2015', () => {
  it('exports User class', () => {
    class MyUser extends User {}
    const user = new MyUser('id123', { foo: 'bar' })

    assert.ok(user instanceof User)
    assert.equal(user.id, 'id123')
    assert.equal(user.foo, 'bar')
  })

  it('exports Brain class', () => {
    class MyBrain extends Brain {}
    const robotMock = {
      on () {
        assert.ok(true)
      }
    }
    const brain = new MyBrain(robotMock)

    assert.ok(brain instanceof Brain)
    brain.set('foo', 'bar')
    assert.equal(brain.get('foo'), 'bar')
  })

  it('exports Robot class', async () => {
    hook('hubot-mock-adapter', require('./fixtures/mock-adapter.js'))

    class MyRobot extends Robot {}
    const robot = new MyRobot('hubot-mock-adapter', false, 'TestHubot')
    await robot.loadAdapter()
    assert.ok(robot instanceof Robot)
    assert.equal(robot.name, 'TestHubot')
    robot.shutdown()
    reset()
  })

  it('exports Adapter class', () => {
    class MyAdapter extends Adapter {}
    const adapter = new MyAdapter('myrobot')

    assert.ok(adapter instanceof Adapter)
    assert.equal(adapter.robot, 'myrobot')
  })

  it('exports Response class', () => {
    class MyResponse extends Response {}
    const robotMock = 'robotMock'
    const messageMock = {
      room: 'room',
      user: 'user'
    }
    const matchMock = 'matchMock'
    const response = new MyResponse(robotMock, messageMock, matchMock)

    assert.ok(response instanceof Response)
    assert.deepEqual(response.message, messageMock)
    assert.equal(response.match, matchMock)
  })

  it('exports Listener class', () => {
    class MyListener extends Listener {}
    const robotMock = 'robotMock'
    const matcherMock = 'matchMock'
    const callback = () => {}
    const listener = new MyListener(robotMock, matcherMock, callback)

    assert.ok(listener instanceof Listener)
    assert.deepEqual(listener.robot, robotMock)
    assert.equal(listener.matcher, matcherMock)
    assert.equal(listener.options.id, null)
    assert.deepEqual(listener.callback, callback)
  })

  it('exports TextListener class', () => {
    class MyTextListener extends TextListener {}
    const robotMock = 'robotMock'
    const regex = /regex/
    const callback = () => {}
    const textListener = new MyTextListener(robotMock, regex, callback)

    assert.ok(textListener instanceof TextListener)
    assert.deepEqual(textListener.regex, regex)
  })

  it('exports Message class', () => {
    class MyMessage extends Message {}
    const userMock = {
      room: 'room'
    }
    const message = new MyMessage(userMock)

    assert.ok(message instanceof Message)
    assert.deepEqual(message.user, userMock)
  })

  it('exports TextMessage class', () => {
    class MyTextMessage extends TextMessage {}
    const userMock = {
      room: 'room'
    }
    const textMessage = new MyTextMessage(userMock, 'bla blah')

    assert.ok(textMessage instanceof TextMessage)
    assert.ok(textMessage instanceof Message)
    assert.equal(textMessage.text, 'bla blah')
  })

  it('exports EnterMessage class', () => {
    class MyEnterMessage extends EnterMessage {}
    const userMock = {
      room: 'room'
    }
    const enterMessage = new MyEnterMessage(userMock)

    assert.ok(enterMessage instanceof EnterMessage)
    assert.ok(enterMessage instanceof Message)
  })

  it('exports LeaveMessage class', () => {
    class MyLeaveMessage extends LeaveMessage {}
    const userMock = {
      room: 'room'
    }
    const leaveMessage = new MyLeaveMessage(userMock)

    assert.ok(leaveMessage instanceof LeaveMessage)
    assert.ok(leaveMessage instanceof Message)
  })

  it('exports TopicMessage class', () => {
    class MyTopicMessage extends TopicMessage {}
    const userMock = {
      room: 'room'
    }
    const topicMessage = new MyTopicMessage(userMock)

    assert.ok(topicMessage instanceof TopicMessage)
    assert.ok(topicMessage instanceof Message)
  })

  it('exports CatchAllMessage class', () => {
    class MyCatchAllMessage extends CatchAllMessage {}
    const messageMock = {
      user: {
        room: 'room'
      }
    }
    const catchAllMessage = new MyCatchAllMessage(messageMock)

    assert.ok(catchAllMessage instanceof CatchAllMessage)
    assert.ok(catchAllMessage instanceof Message)
    assert.deepEqual(catchAllMessage.message, messageMock)
    assert.deepEqual(catchAllMessage.user, messageMock.user)
  })

  it('exports loadBot function', () => {
    assert.ok(Hubot.loadBot && typeof Hubot.loadBot === 'function')
    const robot = Hubot.loadBot('adapter', false, 'botName', 'botAlias')
    assert.equal(robot.name, 'botName')
    assert.equal(robot.alias, 'botAlias')
    robot.shutdown()
  })
})
