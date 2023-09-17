'use strict'

const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('assert/strict')

const Brain = require('../src/brain.js')
const InMemoryDataStore = require('../src/datastores/memory.js')

describe('Datastore', () => {
  let robot = null
  beforeEach(() => {
    robot = {
      emit () {},
      on () {},
      receive (msg) {}
    }
    robot.brain = new Brain(robot)
    robot.datastore = new InMemoryDataStore(robot)
    robot.brain.userForId('1', { name: 'User One' })
    robot.brain.userForId('2', { name: 'User Two' })
  })
  afterEach(() => {
    robot.brain.close()
    // Getting warning about too many listeners, so remove them all
    process.removeAllListeners()
  })

  describe('global scope', () => {
    it('returns undefined for values not in the datastore', async () => {
      const value = await robot.datastore.get('blah')
      assert.deepEqual(value, undefined)
    })

    it('can store simple values', async () => {
      await robot.datastore.set('key', 'value')
      const value = await robot.datastore.get('key')
      assert.equal(value, 'value')
    })

    it('can store arbitrary JavaScript values', async () => {
      const object = {
        name: 'test',
        data: [1, 2, 3]
      }
      await robot.datastore.set('key', object)
      const value = await robot.datastore.get('key')
      assert.equal(value.name, 'test')
      assert.deepEqual(value.data, [1, 2, 3])
    })

    it('can dig inside objects for values', async () => {
      const object = {
        a: 'one',
        b: 'two'
      }
      await robot.datastore.set('key', object)
      const value = await robot.datastore.getObject('key', 'a')
      assert.equal(value, 'one')
    })

    it('can set individual keys inside objects', async () => {
      const object = {
        a: 'one',
        b: 'two'
      }
      await robot.datastore.set('object', object)
      await robot.datastore.setObject('object', 'c', 'three')
      const value = await robot.datastore.get('object')
      assert.equal(value.a, 'one')
      assert.equal(value.b, 'two')
      assert.equal(value.c, 'three')
    })

    it('creates an object from scratch when none exists', async () => {
      await robot.datastore.setObject('object', 'key', 'value')
      const value = await robot.datastore.get('object')
      assert.deepEqual(value, { key: 'value' })
    })

    it('can append to an existing array', async () => {
      await robot.datastore.set('array', [1, 2, 3])
      await robot.datastore.setArray('array', 4)
      const value = await robot.datastore.get('array')
      assert.deepEqual(value, [1, 2, 3, 4])
    })

    it('creates an array from scratch when none exists', async () => {
      await robot.datastore.setArray('array', 4)
      const value = await robot.datastore.get('array')
      assert.deepEqual(value, [4])
    })
    it('creates an array with an array', async () => {
      const expected = [1, 2, 3]
      await robot.datastore.setArray('array', [1, 2, 3])
      const actual = await robot.datastore.get('array')
      assert.deepEqual(actual, expected)
    })
  })

  describe('User scope', () => {
    it('has access to the robot object', () => {
      const user = robot.brain.userForId('1')
      assert.deepEqual(user._getRobot(), robot)
    })

    it('can store user data which is separate from global data', async () => {
      const user = robot.brain.userForId('1')
      await user.set('blah', 'blah')
      const userBlah = await user.get('blah')
      const datastoreBlah = await robot.datastore.get('blah')
      assert.notDeepEqual(userBlah, datastoreBlah)
      assert.equal(userBlah, 'blah')
      assert.deepEqual(datastoreBlah, undefined)
    })

    it('stores user data separate per-user', async () => {
      const userOne = robot.brain.userForId('1')
      const userTwo = robot.brain.userForId('2')
      await userOne.set('blah', 'blah')
      const valueOne = await userOne.get('blah')
      const valueTwo = await userTwo.get('blah')
      assert.notDeepEqual(valueOne, valueTwo)
      assert.equal(valueOne, 'blah')
      assert.deepEqual(valueTwo, undefined)
    })
  })
})
