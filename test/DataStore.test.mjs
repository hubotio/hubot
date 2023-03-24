'use strict'

import InMemoryDataStore from '../src/datastores/memory.mjs'
import {Robot} from '../index.mjs'
import {describe, test, expect} from 'bun:test'

const makeRobot = ()=>{
  const robot = new Robot()
  robot.datastore = new InMemoryDataStore(robot)
  return robot
}
describe('Datastore', function () {
  describe('global scope', ()=> {
    test('returns undefined for values not in the datastore', async () => {
      const robot = makeRobot()
      const value = await robot.datastore.get('blah')
      expect(value).toBeUndefined()
    })

    test('can store simple values', async ()=> {
      const robot = makeRobot()
      await robot.datastore.set('key', 'value')
      const actual = await robot.datastore.get('key')
      expect(actual).toEqual('value')
    })

    test('can store arbitrary JavaScript values', async ()=>{
      const object = {
        name: 'test',
        data: [1, 2, 3]
      }
      const robot = makeRobot()
      await robot.datastore.set('key', object)
      const actual = await robot.datastore.get('key')
      expect(actual).toEqual({name: 'test', data: [1,2,3]})
    })

    test('can dig inside objects for values', async ()=> {
      const object = {
        a: 'one',
        b: 'two'
      }
      const robot = makeRobot()
      await robot.datastore.set('key', object)
      const actual = await robot.datastore.getObject('key', 'a')
      expect(actual).toEqual('one')
    })

    test('can set individual keys inside objects', async ()=> {
      const object = {
        a: 'one',
        b: 'two'
      }
      const robot = makeRobot()
      await robot.datastore.set('object', object)
      await robot.datastore.setObject('object', 'c', 'three')
      const actual = await robot.datastore.get('object')
      expect(actual).toEqual({a: 'one', b: 'two', c: 'three'})
    })

    test('creates an object from scratch when none exists', async ()=> {
      const robot = makeRobot()
      await robot.datastore.setObject('object', 'key', 'value')
      const actual = await robot.datastore.get('object')
      const expected = { key: 'value' }
      expect(actual).toEqual(expected)
    })

    test('can append to an existing array', async ()=>{
      const robot = makeRobot()
      await robot.datastore.set('array', [1, 2, 3])
      await robot.datastore.setArray('array', 4)
      const actual = await robot.datastore.get('array')
      expect(actual).toEqual([1,2,3,4])
    })

    test('creates an array from scratch when none exists', async ()=> {
      const robot = makeRobot()
      await robot.datastore.setArray('array', 4)
      const actual = await robot.datastore.get('array')
      expect(actual).toEqual([4])
    })
  })

  describe('User scope', ()=> {
    test('has access to the robot object', async ()=> {
      const robot = makeRobot()
      const user = robot.brain.userForId('1')
      expect(user.robot).toEqual(robot)
    })

    test('can store user data which is separate from global data', async ()=> {
      const robot = makeRobot()
      const user = robot.brain.userForId('1')
      await user.set('blah', 'blah')
      const actual = await user.get('blah')
      const actual2 = await robot.datastore.get('blah')
      expect(actual).not.toEqual(actual2)
      expect(actual).toEqual('blah')
      expect(actual2).toEqual(undefined)
    })

    test('stores user data separate per-user', async ()=> {
      const robot = makeRobot()
      const userOne = robot.brain.userForId('1')
      const userTwo = robot.brain.userForId('2')
      await userOne.set('blah', 'blah')
      const valueOne = await userOne.get('blah')
      const valueTwo = await userTwo.get('blah')
      expect(valueOne).not.toEqual(valueTwo)
      expect(valueOne).toEqual('blah')
      expect(valueTwo).toEqual(undefined)
    })
  })
})
