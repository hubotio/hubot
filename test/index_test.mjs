'use strict'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  Adapter, User, Brain, Robot, Response, Listener, TextListener,
  Message, TextMessage, EnterMessage, LeaveMessage, TopicMessage, CatchAllMessage, loadBot
} from '../index.mjs'
import mockAdapter from './fixtures/MockAdapter.mjs'

describe('hubot/index', () => {
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
    class MyRobot extends Robot {}
    const robot = new MyRobot(mockAdapter, false, 'TestHubot')
    await robot.loadAdapter()
    assert.ok(robot instanceof Robot)
    assert.equal(robot.name, 'TestHubot')
    robot.shutdown()
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
    assert.ok(loadBot && typeof loadBot === 'function')
    const robot = loadBot('adapter', false, 'botName', 'botAlias')
    assert.equal(robot.name, 'botName')
    assert.equal(robot.alias, 'botAlias')
    robot.shutdown()
  })
})
