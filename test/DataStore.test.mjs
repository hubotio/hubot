'use strict'

import InMemoryDataStore from '../src/datastores/memory.mjs'

import {Robot} from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, it, expect} from 'bun:test'

const makeRobot = ()=>{
  const robot = new Robot()
  robot.datastore = new InMemoryDataStore(robot)
  return robot
}
describe('Datastore', function () {
  describe('global scope', ()=> {
    it('returns undefined for values not in the datastore', async () => {
      const robot = makeRobot()
      const value = await robot.datastore.get('blah')
      expect(value).to.be.undefined
    })

    it('can store simple values', async ()=> {
      const robot = makeRobot()
      await robot.datastore.set('key', 'value')
      const actual = await robot.datastore.get('key')
      assert.deepEqual(actual, 'value')
    })

    it('can store arbitrary JavaScript values', async ()=>{
      const object = {
        name: 'test',
        data: [1, 2, 3]
      }
      const robot = makeRobot()
      await robot.datastore.set('key', object)
      const actual = await robot.datastore.get('key')
      assert.deepEqual(actual, {name: 'test', data: [1,2,3]})
    })

    it('can dig inside objects for values', async ()=> {
      const object = {
        a: 'one',
        b: 'two'
      }
      const robot = makeRobot()
      await robot.datastore.set('key', object)
      const actual = await robot.datastore.getObject('key', 'a')
      assert.deepEqual(actual, 'one')
    })

    it('can set individual keys inside objects', async ()=> {
      const object = {
        a: 'one',
        b: 'two'
      }
      const robot = makeRobot()
      await robot.datastore.set('object', object)
      await robot.datastore.setObject('object', 'c', 'three')
      const actual = await robot.datastore.get('object')
      assert.deepEqual(actual, {a: 'one', b: 'two', c: 'three'})
    })

    it('creates an object from scratch when none exists', async ()=> {
      const robot = makeRobot()
      await robot.datastore.setObject('object', 'key', 'value')
      const actual = await robot.datastore.get('object')
      const expected = { key: 'value' }
      assert.deepEqual(actual, expected)
    })

    it('can append to an existing array', async ()=>{
      const robot = makeRobot()
      await robot.datastore.set('array', [1, 2, 3])
      await robot.datastore.setArray('array', 4)
      const actual = await robot.datastore.get('array')
      assert.deepEqual(actual, [1,2,3,4])
    })

    it('creates an array from scratch when none exists', async ()=> {
      const robot = makeRobot()
      await robot.datastore.setArray('array', 4)
      const actual = await robot.datastore.get('array')
      assert.deepEqual(actual, [4])
    })
  })

  describe('User scope', ()=> {
    it('has access to the robot object', async ()=> {
      const robot = makeRobot()
      const user = robot.brain.userForId('1')
      assert.deepEqual(user.robot, robot)
    })

    it('can store user data which is separate from global data', async ()=> {
      const robot = makeRobot()
      const user = robot.brain.userForId('1')
      await user.set('blah', 'blah')
      const actual = await user.get('blah')
      const actual2 = await robot.datastore.get('blah')
      assert.notDeepEqual(actual, actual2)
      assert.deepEqual(actual, 'blah')
      assert.deepEqual(actual2, undefined)
    })

    it('stores user data separate per-user', async ()=> {
      const robot = makeRobot()
      const userOne = robot.brain.userForId('1')
      const userTwo = robot.brain.userForId('2')
      await userOne.set('blah', 'blah')
      const valueOne = await userOne.get('blah')
      const valueTwo = await userTwo.get('blah')
      assert.notDeepEqual(valueOne, valueTwo)
      assert.deepEqual(valueOne, 'blah')
      assert.deepEqual(valueTwo, undefined)
    })
  })
})
