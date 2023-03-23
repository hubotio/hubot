'use strict'

import {Brain, User} from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, it, expect} from 'bun:test'

const mockRobot = {
  emit () {},
  on () {}
}
describe('Brain', function () {
  describe('Unit Tests', () => {
    describe('#mergeData', () => {
      it('performs a proper merge with the new data taking precedent', async () => {
        const brain = new Brain(mockRobot)
        brain.user1 = brain.userForId('1', { name: 'Guy One' })
        brain.user2 = brain.userForId('2', { name: 'Guy One Two' })
        brain.user3 = brain.userForId('3', { name: 'Girl Three' })
        brain.data = {
          1: 'old',
          2: 'old'
        }
        brain.mergeData({ 2: 'new' })
        assert.deepEqual(brain.data, {
          1: 'old',
          2: 'new'
        })
      })

      it('emits a loaded event with the new data', done => {
        const brain = new Brain(mockRobot)
        brain.on('loaded', data=>{
          assert.deepEqual(data, brain.data)
          done()
        })
        brain.mergeData({})
      })

      it('coerces loaded data into User objects', async () => {
        const brain = new Brain(mockRobot)
        brain.mergeData({ users: { 4: { name: 'new', id: '4' } } })
        const user = brain.userForId('4')
        assert.ok(user instanceof User)
        assert.deepEqual(user.id, '4')
        assert.deepEqual(user.name, 'new')
      })
    })

    describe('#save', () => it('emits a save event', done => {
      const brain = new Brain(mockRobot)
      brain.on('save', data=>{
        clearInterval(brain.saveInterval)
        assert.deepEqual(data, brain.data)
        done()
      })
      brain.save()
    }))

    describe('#resetSaveInterval', () => it('updates the auto-save interval', done=>{
      const brain = new Brain(mockRobot)
      const now = Date.now()
      brain.on('save', data => {
        clearInterval(brain.saveInterval)
        const actual = Date.now() - now
        assert.ok(actual > 5 * 1000)
        done()
      })
      brain.resetSaveInterval(6)
      brain.setAutoSave(true)
    }))

    describe('#close', () => {
      it('saves', done => {
        const brain = new Brain(mockRobot)
        const listener = data => {
          brain.off('save', listener)
          assert.ok(data)
          done()
        }
        brain.on('save', listener)
        brain.close()
      })

      it('emits a close event', done => {
        const brain = new Brain(mockRobot)
        const listener = data => {
          brain.off('close', listener)
          assert.ok(true)
          done()
        }
        brain.on('close', listener)
        brain.close()
      })

      it('saves before emitting the close event', done => {
        const brain = new Brain(mockRobot)
        let counter = 0
        const saveListener = data => {
          brain.off('save', saveListener)
          assert.deepEqual(++counter, 1)
        }
        const listener = data => {
          brain.off('close', listener)
          assert.deepEqual(++counter, 2)
          done()
        }
        brain.on('save', saveListener)
        brain.on('close', listener)
        brain.close()
      })

      it('stops auto-saving', done => {
        const brain = new Brain(mockRobot)
        const saveListener = data => {
          assert.fail('stop saving')
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
      it('returns the saved value', async ()=>{
        const brain = new Brain(mockRobot)
        brain.data._private['test-key'] = 'value'
        assert.deepEqual(brain.get('test-key'), 'value')
      })

      it('returns null if object is not found', async ()=>{
        const brain = new Brain(mockRobot)
        assert.deepEqual(brain.get('not a real key'), null)
      })
    })

    describe.skip('#set', () => {
      it('saves the value', async () => {
        const brain = new Brain(mockRobot)
        brain.set('test-key', 'value')
        assert.deepEqual(brain.data._private['test-key'], 'value')
      })

      it('sets multiple keys at once if an object is provided', async () => {
        const brain = new Brain(mockRobot)
        brain.data._private = {
          key1: 'val1',
          key2: 'val1'
        }

        brain.set({
          key2: 'val2',
          key3: 'val2'
        })

        assert.deepEqual(brain.data._private, {
          key1: 'val1',
          key2: 'val2',
          key3: 'val2'
        })
      })

      // Unable to understand why this behavior is needed, but adding a test
      // case to protect it
      it('emits loaded', done => {
        const brain = new Brain(mockRobot)
        brain.on('loaded', data => {
          assert.deepEqual(data.get('test-key'), 'value')
          done()
        })
        brain.set('test-key', 'value')
      })

      it('returns the brain', async () => {
        const brain = new Brain(mockRobot)
        const actual = brain.set('test-key', 'value')
        assert.deepEqual(actual, brain)
      })
    })

    describe('#remove', () => it('removes the specified key', async ()=> {
      const brain = new Brain(mockRobot)
      brain.data._private['test-key'] = 'value'
      brain.remove('test-key')
      assert.ok(!Object.keys(brain.data._private).some(k => k == 'test-key'))
    }))

    describe('#userForId', () => {
      it('returns the user object', async ()=> {
        const brain = new Brain(mockRobot)
        const user = new User('1', {name: 'Guy One' })
        brain.userForId('1', { name: 'Guy One' })
        assert.deepEqual(brain.userForId(1), user)
      })

      it('does an exact match', async ()=> {
        const brain = new Brain(mockRobot)
        const user = new User('FOUR', {})
        brain.userForId('FOUR')
        assert.notDeepEqual(brain.userForId('four'), user)
      })

      describe.skip('when there is no matching user ID', ()=> {
        it('creates a new User', async ()=> {
          const brain = new Brain(mockRobot)
          assert.ok(!Object.keys(brain.data.users).some(key => key == 'all-new-user'))
          const newUser = brain.userForId('all-new-user')
          assert.deepEqual(newUser.id, 'all-new-user')
          assert.ok(Object.keys(brain.data.users).some(key => key == 'all-new-user'))
        })

        it('passes the provided options to the new User', async ()=> {
          const brain = new Brain(mockRobot)
          const newUser = brain.userForId('all-new-user', { name: 'All New User', prop: 'mine' })
          assert.deepEqual(newUser.name, 'All New User')
          assert.deepEqual(newUser.prop, 'mine')
        })
      })
    })

    describe('#userForName', ()=> {
      it('returns the user with a matching name', async ()=> {
        const brain = new Brain(mockRobot)
        const user = new User('1', {name: 'Guy One'})
        brain.userForId('1', {name: 'Guy One'})
        assert.deepEqual(brain.userForName('Guy One'), user)
      })

      it('does a case-insensitive match', async ()=> {
        const brain = new Brain(mockRobot)
        const user = new User('1', {name: 'Guy one'})
        brain.userForId('1', {name: 'Guy one'})
        assert.deepEqual(brain.userForName('guy one'), user)
      })

      it('returns null if no user matches', async ()=> {
        const brain = new Brain(mockRobot)
        assert.deepEqual(brain.userForName('not a real user'), null)
      })
    })

    describe('#usersForRawFuzzyName', ()=> {
      it('does a case-insensitive match', async ()=> {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'Guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'Guy one'})
        brain.userForId('2', {name: 'Guy two'})
        assert.deepEqual(brain.usersForRawFuzzyName('guy'), [user1, user2])
      })

      it('returns all matching users (prefix match) when there is not an exact match (case-insensitive)', function () {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'Guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'Guy one'})
        brain.userForId('2', {name: 'Guy two'})
        assert.deepEqual(brain.usersForRawFuzzyName('Guy'), [user1, user2])
      })

      it('returns all matching users (prefix match) when there is an exact match (case-insensitive)', async ()=> {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'guy one'})
        brain.userForId('2', {name: 'Guy two'})
        assert.deepEqual(brain.usersForRawFuzzyName('Guy One'), [user1])
        assert.deepEqual(brain.usersForRawFuzzyName('guy one'), [user1])
      })

      it('returns an empty array if no users match', async ()=> {
        const brain = new Brain(mockRobot)
        const result = brain.usersForRawFuzzyName('not a real user')
        assert.deepEqual(result, [])
      })
    })

    describe('#usersForFuzzyName', ()=> {
      it('does a case-insensitive match', async ()=>{
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'guy one'})
        brain.userForId('2', {name: 'Guy two'})
        assert.deepEqual(brain.usersForFuzzyName('guy'), [user1, user2])
      })

      it('returns all matching users (prefix match) when there is not an exact match', async ()=> {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'guy one'})
        const user2 = new User('2', {name: 'Guy two'})
        brain.userForId('1', {name: 'guy one'})
        brain.userForId('2', {name: 'Guy two'})
        assert.deepEqual(brain.usersForFuzzyName('Guy'), [user1, user2])
      })

      it('returns just the user when there is an exact match (case-insensitive)', async ()=> {
        const brain = new Brain(mockRobot)
        const user1 = new User('1', {name: 'guy one'})
        brain.userForId('1', {name: 'guy one'})
        assert.deepEqual(brain.usersForFuzzyName('Guy One'), [user1])
        assert.deepEqual(brain.usersForFuzzyName('guy one'), [user1])
      })
    })
  })
})