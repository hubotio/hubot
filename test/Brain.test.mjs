'use strict'

import {Brain, User} from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, test, expect} from 'bun:test'

const mockRobot = {
  emit () {},
  on () {}
}
describe('Brain', function () {
  describe('Unit Tests', () => {
    describe('#mergeData', () => {
      test('performs a proper merge with the new data taking precedent', async () => {
        const brain = new Brain(mockRobot)
        brain.user1 = brain.userForId('1', { name: 'Guy One' })
        brain.user2 = brain.userForId('2', { name: 'Guy One Two' })
        brain.user3 = brain.userForId('3', { name: 'Girl Three' })
        brain.data = {
          1: 'old',
          2: 'old'
        }
        brain.mergeData({ 2: 'new' })
        expect(brain.data).toEqual({
          1: 'old',
          2: 'new'
        })
      })

      test('emits a loaded event with the new data', done => {
        const brain = new Brain(mockRobot)
        brain.on('loaded', data=>{
          expect(data).toEqual(brain.data)
          done()
        })
        brain.mergeData({})
      })

      test('coerces loaded data into User objects', async () => {
        const brain = new Brain(mockRobot)
        brain.mergeData({ users: { 4: { name: 'new', id: '4' } } })
        const user = brain.userForId('4')
        expect(user instanceof User).toBe(true)
        expect(user.id).toEqual('4')
        expect(user.name).toEqual('new')
      })
    })

    describe('#save', () => test('emits a save event', done => {
      const brain = new Brain(mockRobot)
      brain.on('save', data=>{
        clearInterval(brain.saveInterval)
        expect(data).toEqual(brain.data)
        done()
      })
      brain.save()
    }))

    describe('#resetSaveInterval', () => test('updates the auto-save interval', done=>{
      const brain = new Brain(mockRobot)
      const now = Date.now()
      brain.on('save', data => {
        clearInterval(brain.saveInterval)
        const actual = Date.now() - now
        expect(actual).toBeGreaterThan(5 * 1000)
        done()
      })
      brain.resetSaveInterval(6)
      brain.setAutoSave(true)
    }))

    describe('#close', () => {
      test('saves', done => {
        const brain = new Brain(mockRobot)
        const listener = data => {
          brain.off('save', listener)
          expect(data).toBeDefined()
          done()
        }
        brain.on('save', listener)
        brain.close()
      })

      test('emits a close event', done => {
        const brain = new Brain(mockRobot)
        const listener = data => {
          brain.off('close', listener)
          expect(true).toBe(true)
          done()
        }
        brain.on('close', listener)
        brain.close()
      })

      test('saves before emitting the close event', done => {
        const brain = new Brain(mockRobot)
        let counter = 0
        const saveListener = data => {
          brain.off('save', saveListener)
          expect(++counter).toEqual(1)
        }
        const listener = data => {
          brain.off('close', listener)
          expect(++counter).toEqual(2)
          done()
        }
        brain.on('save', saveListener)
        brain.on('close', listener)
        brain.close()
      })

      test('stops auto-saving', done => {
        const brain = new Brain(mockRobot)
        const saveListener = data => {
          expect('stop saving').not.toBe()
        }

        brain.setAutoSave(true)
        brain.close()
        brain.on('save', saveListener)
        setTimeout(()=>{
          done()
        }, 6000)
      })
    })

    describe('#get', () => {
      test('returns the saved value', async ()=>{
        const brain = new Brain(mockRobot)
        brain.data._private['test-key'] = 'value'
        expect(brain.get('test-key')).toEqual('value')
      })

      test('returns null if object is not found', async ()=>{
        const brain = new Brain(mockRobot)
        expect(brain.get('not a real key')).toBeNull()
      })
    })

    describe.skip('#set', () => {
      test('saves the value', async () => {
        const brain = new Brain(mockRobot)
        brain.set('test-key', 'value')
        expect(brain.data._private['test-key']).toEqual('value')
      })

      test('sets multiple keys at once if an object is provided', async () => {
        const brain = new Brain(mockRobot)
        brain.data._private = {
          key1: 'val1',
          key2: 'val1'
        }

        brain.set({
          key2: 'val2',
          key3: 'val2'
        })
        expect(brain.data._private).toEqual({
          key1: 'val1',
          key2: 'val2',
          key3: 'val2'
        })
      })

      // Unable to understand why this behavior is needed, but adding a test
      // case to protect it
      test('emits loaded', done => {
        const brain = new Brain(mockRobot)
        brain.on('loaded', data => {
          expect(data.get('test-key')).toEqual('value')
          done()
        })
        brain.set('test-key', 'value')
      })

      test('returns the brain', async () => {
        const brain = new Brain(mockRobot)
        const actual = brain.set('test-key', 'value')
        expect(actual).toEqual(brain)
      })
    })

    describe('#remove', () => test('removes the specified key', async ()=> {
      const brain = new Brain(mockRobot)
      brain.data._private['test-key'] = 'value'
      brain.remove('test-key')
      expect(Object.keys(brain.data._private).not.toContain('test-key'))
    }))

    describe('#userForId', () => {
      test('returns the user object', async ()=> {
        const brain = new Brain(mockRobot)
        const user = new User('1', {name: 'Guy One' })
        brain.userForId('1', { name: 'Guy One' })
        expect(brain.userForId(1)).toEqual(user)
      })

      test('does an exact match', async ()=> {
        const brain = new Brain(mockRobot)
        const user = new User('FOUR', {})
        brain.userForId('FOUR')
        expect(brain.userForId('four')).not.toEqual(user)
      })

      describe.skip('when there is no matching user ID', ()=> {
        test('creates a new User', async ()=> {
          const brain = new Brain(mockRobot)
          assert.ok(!Object.keys(brain.data.users).some(key => key == 'all-new-user'))
          const newUser = brain.userForId('all-new-user')
          expect(newUser.id).toEqual('all-new-user')
          expect(Object.keys(brain.data.users)).toContain('all-new-user')
        })

        test('passes the provided options to the new User', async ()=> {
          const brain = new Brain(mockRobot)
          const newUser = brain.userForId('all-new-user', { name: 'All New User', prop: 'mine' })
          expect(newUser.name).toEqual('All New User')
          expect(newUser.prop).toEqual('mine')
        })
      })
    })

    describe('#userForName', ()=> {
      test('returns the user with a matching name', async ()=> {
        const brain = new Brain(mockRobot)
        const user = new User('1', {name: 'Guy One'})
        brain.userForId('1', {name: 'Guy One'})
        expect(brain.userForName('Guy One')).toEqual(user)
      })

      test('does a case-insensitive match', async ()=> {
        const brain = new Brain(mockRobot)
        const user = new User('1', {name: 'Guy one'})
        brain.userForId('1', {name: 'Guy one'})
        expect(brain.userForName('guy one')).toEqual(user)
      })

      test('returns null if no user matches', async ()=> {
        const brain = new Brain(mockRobot)
        expect(brain.userForName('not a real user')).toBeNull()
      })
    })

    describe('#usersForRawFuzzyName', ()=> {
      test('does a case-insensitive match', async ()=> {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'Guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'Guy one'})
        brain.userForId('2', {name: 'Guy two'})
        expect(brain.usersForRawFuzzyName('guy')).toEqual([user1, user2])
      })

      test('returns all matching users (prefix match) when there is not an exact match (case-insensitive)', function () {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'Guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'Guy one'})
        brain.userForId('2', {name: 'Guy two'})
        expect(brain.usersForRawFuzzyName('Guy')).toEqual([user1, user2])
      })

      test('returns all matching users (prefix match) when there is an exact match (case-insensitive)', async ()=> {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'guy one'})
        brain.userForId('2', {name: 'Guy two'})
        expect(brain.usersForRawFuzzyName('Guy One')).toEqual([user1])
        expect(brain.usersForRawFuzzyName('guy one')).toEqual([user1])
      })

      test('returns an empty array if no users match', async ()=> {
        const brain = new Brain(mockRobot)
        expect(brain.usersForRawFuzzyName('not a real user')).toEqual([])
      })
    })

    describe('#usersForFuzzyName', ()=> {
      test('does a case-insensitive match', async ()=>{
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'guy one'})
        brain.userForId('2', {name: 'Guy two'})
        expect(brain.usersForFuzzyName('guy')).toEqual([user1, user2])
      })

      test('returns all matching users (prefix match) when there is not an exact match', async ()=> {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'guy one'})
        brain.userForId('2', {name: 'Guy two'})
        expect(brain.usersForFuzzyName('Guy')).toEqual([user1, user2])
      })

      test('returns just the user when there is an exact match (case-insensitive)', async ()=> {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'guy one'})
        brain.userForId('1', {name: 'guy one'})
        expect(brain.usersForFuzzyName('Guy One')).toEqual([user1])
        expect(brain.usersForFuzzyName('guy one')).toEqual([user1])
      })
    })
  })
})