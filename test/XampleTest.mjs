import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

// Replace this with import { Robot } from 'hubot'
import { Robot } from '../index.mjs'

// You need a dummy adapter to test scripts
import dummyRobot from './doubles/DummyAdapter.mjs'

// Mocks Aren't Stubs
// https://www.martinfowler.com/articles/mocksArentStubs.html

describe('Xample testing Hubot scripts', () => {
  let robot = null
  beforeEach(async () => {
    robot = new Robot(dummyRobot, false, 'Dumbotheelephant')
    await robot.loadAdapter()
    await robot.loadFile('./test/scripts', 'Xample.mjs')
    await robot.run()
  })
  afterEach(() => {
    robot.shutdown()
  })
  it('should reply with expected message', async () => {
    const expected = 'HELO World! I\'m Dumbotheelephant.'
    const user = robot.brain.userForId('test-user', { name: 'test user' })
    let actual = ''
    robot.on('reply', (envelope, ...strings) => {
      actual = strings.join('')
    })
    await robot.adapter.say(user, '@Dumbotheelephant helo', 'test-room')
    assert.strictEqual(actual, expected)
  })

  it('should send message to the #general room', async () => {
    const expected = 'general'
    const user = robot.brain.userForId('test-user', { name: 'test user' })
    let actual = ''
    robot.on('send', (envelope, ...strings) => {
      actual = envelope.room
    })
    await robot.adapter.say(user, '@Dumbotheelephant helo room', 'general')
    assert.strictEqual(actual, expected)
  })
})
