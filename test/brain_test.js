'use strict'

/* eslint-disable no-unused-expressions */

const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('assert/strict')

// Hubot classes
const User = require('../src/user.js')
const Robot = require('../src/robot.js')
const Brain = require('../src/brain.js')
const { hook, reset } = require('./fixtures/RequireMocker.js')
const mockAdapter = require('./fixtures/mock-adapter.js')

describe('Brain', () => {
  let mockRobot = null
  let user1 = null
  let user2 = null
  let user3 = null
  beforeEach(async () => {
    hook('hubot-mock-adapter', mockAdapter)
    mockRobot = new Robot('hubot-mock-adapter', false, 'TestHubot')
    await mockRobot.loadAdapter('hubot-mock-adapter')
    mockRobot.run()
    user1 = mockRobot.brain.userForId('1', { name: 'Guy One' })
    user2 = mockRobot.brain.userForId('2', { name: 'Guy One Two' })
    user3 = mockRobot.brain.userForId('3', { name: 'Girl Three' })
  })
  afterEach(() => {
    mockRobot.shutdown()
    reset()
    process.removeAllListeners()
  })
  describe('Unit Tests', () => {
    describe('#mergeData', () => {
      it('performs a proper merge with the new data taking precedent', () => {
        mockRobot.brain.data = {
          1: 'old',
          2: 'old'
        }

        mockRobot.brain.mergeData({ 2: 'new' })

        assert.deepEqual(mockRobot.brain.data, {
          1: 'old',
          2: 'new'
        }, 'The data should be merged properly.')
      })

      it('emits a loaded event with the new data', (t, done) => {
        const loadedListener = (data) => {
          assert.ok(typeof data === 'object', 'data should be an object.')
          mockRobot.brain.off('loaded', loadedListener)
          done()
        }
        mockRobot.brain.on('loaded', loadedListener)
        mockRobot.brain.mergeData({})
      })

      it('coerces loaded data into User objects', () => {
        mockRobot.brain.mergeData({ users: { 4: { name: 'new', id: '4' } } })
        const user = mockRobot.brain.userForId('4')
        assert.ok(user instanceof User)
        assert.equal(user.id, '4')
        assert.equal(user.name, 'new')
      })
    })

    describe('#save', () => {
      it('emits a save event', (t, done) => {
        const saveListener = (data) => {
          assert.deepEqual(data, mockRobot.brain.data)
          mockRobot.brain.off('save', saveListener)
          done()
        }
        mockRobot.brain.on('save', saveListener)
        mockRobot.brain.save()
      })
    })

    describe('#resetSaveInterval', () => {
      it('updates the auto-save interval', async () => {
        let wasCalled = false
        const shouldNotBeCalled = (data) => {
          assert.fail('save event should not have been emitted')
        }
        const shouldBeCalled = (data) => {
          mockRobot.brain.off('save', shouldBeCalled)
          wasCalled = true
        }
        mockRobot.brain.on('save', shouldNotBeCalled)
        mockRobot.brain.on('save', shouldBeCalled)
        // make sure autosave is on
        mockRobot.brain.setAutoSave(true)
        // default is 5s
        mockRobot.brain.resetSaveInterval(6)

        await Promise.all([
          new Promise((resolve, reject) => {
            setTimeout(() => {
              assert.deepEqual(wasCalled, true, 'save event should have been emitted')
              resolve()
            }, 1000 * 6)
          }),
          new Promise((resolve, reject) => {
            setTimeout(() => {
              assert.notEqual(wasCalled, true)
              mockRobot.brain.off('save', shouldNotBeCalled)
              resolve()
            }, 1000 * 5)
          })
        ])
      })
    })

    describe('#close', () => {
      it('saves', (t, done) => {
        const saveListener = data => {
          mockRobot.brain.off('save', saveListener)
          assert.ok(data)
          done()
        }
        mockRobot.brain.on('save', saveListener)
        mockRobot.brain.close()
      })

      it('emits a close event', (t, done) => {
        const closeListener = () => {
          mockRobot.brain.off('close', closeListener)
          assert.ok(true)
          done()
        }
        mockRobot.brain.on('close', closeListener)
        mockRobot.brain.close()
      })

      it('saves before emitting the close event', (t, done) => {
        let wasSaveCalled = false
        const saveListener = data => {
          mockRobot.brain.off('save', saveListener)
          wasSaveCalled = true
        }
        const closeListener = () => {
          mockRobot.brain.off('close', closeListener)
          assert.ok(wasSaveCalled)
          done()
        }
        mockRobot.brain.on('save', saveListener)
        mockRobot.brain.on('close', closeListener)
        mockRobot.brain.close()
      })

      it('stops auto-saving', (t, done) => {
        // make sure autosave is on
        mockRobot.brain.setAutoSave(true)
        mockRobot.brain.close()

        // set up the spy after because 'close' calls 'save'
        const saveListener = data => {
          assert.fail('save event should not have been emitted')
        }
        mockRobot.brain.on('save', saveListener)
        setTimeout(() => {
          assert.ok(true)
          mockRobot.brain.off('save', saveListener)
          done()
        }, 1000 * 10)
      })
    })

    describe('#get', () => {
      it('returns the saved value', () => {
        const brain = new Brain(mockRobot)
        brain.set('test-key', 'value')
        assert.equal(brain.get('test-key'), 'value')
        brain.close()
      })

      it('returns null if object is not found', () => {
        const brain = new Brain(mockRobot)
        assert.equal(brain.get('not a real key'), null)
        brain.close()
      })
    })

    describe('#set', () => {
      it('sets multiple keys at once if an object is provided', () => {
        mockRobot.brain.data._private = {
          key1: 'val1',
          key2: 'val1'
        }

        mockRobot.brain.set({
          key2: 'val2',
          key3: 'val2'
        })

        assert.deepEqual(mockRobot.brain.data._private, {
          key1: 'val1',
          key2: 'val2',
          key3: 'val2'
        })
      })

      // Unable to understand why this behavior is needed, but adding a test
      // case to protect it
      it('emits loaded', (t, done) => {
        const loadedListener = (data) => {
          assert.deepEqual(data, mockRobot.brain.data)
          mockRobot.brain.off('loaded', loadedListener)
          done()
        }
        mockRobot.brain.on('loaded', loadedListener)
        mockRobot.brain.set('test-key', 'value')
      })

      it('returns the mockRobot.brain', () => {
        assert.deepEqual(mockRobot.brain.set('test-key', 'value'), mockRobot.brain)
      })
    })

    describe('#remove', () => it('removes the specified key', () => {
      mockRobot.brain.set('test-key', 'value')
      mockRobot.brain.remove('test-key')
      assert.deepEqual(Object.keys(mockRobot.brain.data._private).includes('test-key'), false)
    }))

    describe('#userForId', () => {
      it('returns the user object', () => {
        const brain = new Brain(mockRobot)
        brain.userForId('1', user1)
        assert.deepEqual(brain.userForId('1'), user1)
        brain.close()
      })

      it('does an exact match', () => {
        const user4 = mockRobot.brain.userForId('FOUR')
        assert.notDeepEqual(mockRobot.brain.userForId('four'), user4)
      })

      // Cannot understand why this behavior is needed, but adding a test case
      // to protect it
      it('recreates the user if the room option differs from the user object', () => {
        assert.equal(mockRobot.brain.userForId(1).room, undefined)

        // undefined -> having a room
        const newUser1 = mockRobot.brain.userForId(1, { room: 'room1' })
        assert.notDeepEqual(newUser1, user1)

        // changing the room
        const newUser2 = mockRobot.brain.userForId(1, { room: 'room2' })
        assert.notDeepEqual(newUser2, newUser1)
      })

      describe('when there is no matching user ID', () => {
        it('creates a new User', () => {
          assert.notEqual(Object.keys(mockRobot.brain.data.users).includes('all-new-user'), true)
          const newUser = mockRobot.brain.userForId('all-new-user')
          assert.ok(newUser instanceof User)
          assert.equal(newUser.id, 'all-new-user')
          assert.ok(Object.keys(mockRobot.brain.data.users).includes('all-new-user'))
        })

        it('passes the provided options to the new User', () => {
          const brain = new Brain(mockRobot)
          const newUser = brain.userForId('all-new-user', { name: 'All New User', prop: 'mine' })
          assert.equal(newUser.name, 'All New User')
          assert.equal(newUser.prop, 'mine')
          brain.close()
        })
      })
    })

    describe('#userForName', () => {
      it('returns the user with a matching name', () => {
        const user = { id: 'user-for-name-guy-one', name: 'Guy One' }
        const brain = new Brain(mockRobot)
        const guy = brain.userForId('user-for-name-guy-one', user)
        assert.deepEqual(brain.userForName('Guy One'), guy)
        brain.close()
      })

      it('does a case-insensitive match', () => {
        const user = { name: 'Guy One' }
        const brain = new Brain(mockRobot)
        const guy = brain.userForId('user-for-name-guy-one-case-insensitive', user)
        assert.deepEqual(brain.userForName('guy one'), guy)
        brain.close()
      })

      it('returns null if no user matches', () => {
        assert.equal(mockRobot.brain.userForName('not a real user'), null)
      })
    })

    describe('#usersForRawFuzzyName', () => {
      it('does a case-insensitive match', () => {
        const brain = new Brain(mockRobot)
        const guy = brain.userForId('1', user1)
        const guy2 = brain.userForId('2', user2)
        assert.ok(brain.usersForRawFuzzyName('guy').includes(guy) && brain.usersForRawFuzzyName('guy').includes(guy2))
        brain.close()
      })

      it('returns all matching users (prefix match) when there is not an exact match (case-insensitive)', () => {
        const brain = new Brain(mockRobot)
        const guy = brain.userForId('1', user1)
        const guy2 = brain.userForId('2', user2)
        assert.ok(brain.usersForRawFuzzyName('Guy').includes(guy) && brain.usersForRawFuzzyName('Guy').includes(guy2))
        brain.close()
      })

      it('returns all matching users (prefix match) when there is an exact match (case-insensitive)', () => {
        const brain = new Brain(mockRobot)
        const girl = brain.userForId('1', user1)
        const girl2 = brain.userForId('2', user2)
        // Matched case
        assert.deepEqual(brain.usersForRawFuzzyName('Guy One'), [girl, girl2])
        // Mismatched case
        assert.deepEqual(brain.usersForRawFuzzyName('guy one'), [girl, girl2])
        brain.close()
      })

      it('returns an empty array if no users match', () => {
        const result = mockRobot.brain.usersForRawFuzzyName('not a real user')
        assert.equal(result.length, 0)
      })
    })

    describe('#usersForFuzzyName', () => {
      it('does a case-insensitive match', () => {
        const brain = new Brain(mockRobot)
        const girl = brain.userForId('1', user1)
        const girl2 = brain.userForId('2', user2)
        assert.ok(brain.usersForFuzzyName('guy').includes(girl) && brain.usersForFuzzyName('guy').includes(girl2))
        brain.close()
      })

      it('returns all matching users (prefix match) when there is not an exact match', () => {
        const brain = new Brain(mockRobot)
        const girl = brain.userForId('1', user1)
        const girl2 = brain.userForId('2', user2)
        assert.ok(brain.usersForFuzzyName('Guy').includes(girl) && brain.usersForFuzzyName('Guy').includes(girl2))
        brain.close()
      })

      it('returns just the user when there is an exact match (case-insensitive)', () => {
        const brain = new Brain(mockRobot)
        const girl = brain.userForId('1', user1)
        brain.userForId('2', user2)
        // Matched case
        assert.deepEqual(brain.usersForFuzzyName('Guy One'), [girl])
        // Mismatched case
        assert.deepEqual(brain.usersForFuzzyName('guy one'), [girl])
        brain.close()
      })

      it('returns an empty array if no users match', () => {
        const result = mockRobot.brain.usersForFuzzyName('not a real user')
        assert.equal(result.length, 0)
      })
    })
  })

  describe('Auto-Save', () => {
    it('is on by default', () => {
      assert.deepEqual(mockRobot.brain.autoSave, true)
    })

    it('automatically saves every 5 seconds when turned on', (t, done) => {
      let wasCalled = false
      const saveListener = data => {
        mockRobot.brain.off('save', saveListener)
        wasCalled = true
      }
      mockRobot.brain.on('save', saveListener)
      mockRobot.brain.setAutoSave(true)
      setTimeout(() => {
        mockRobot.brain.off('save', saveListener)
        assert.deepEqual(wasCalled, true)
        done()
      }, 1000 * 5.5)
    })

    it('does not auto-save when turned off', (t, done) => {
      let wasCalled = false
      const saveListener = data => {
        wasCalled = true
        assert.fail('save event should not have been emitted')
      }
      mockRobot.brain.setAutoSave(false)
      mockRobot.brain.on('save', saveListener)
      setTimeout(() => {
        assert.notEqual(wasCalled, true)
        mockRobot.brain.off('save', saveListener)
        done()
      }, 1000 * 10)
    })
  })

  describe('User Searching', () => {
    it('finds users by ID', () => {
      assert.deepEqual(mockRobot.brain.userForId('1'), user1)
    })

    it('finds users by exact name', () => {
      assert.deepEqual(mockRobot.brain.userForName('Guy One'), user1)
    })

    it('finds users by fuzzy name (prefix match)', () => {
      const result = mockRobot.brain.usersForFuzzyName('Guy')
      assert.ok(result.includes(user1) && result.includes(user2))
      assert.ok(!result.includes(user3))
    })

    it('returns User objects, not POJOs', () => {
      assert.ok(mockRobot.brain.userForId('1') instanceof User)
      for (const user of mockRobot.brain.usersForFuzzyName('Guy')) {
        assert.ok(user instanceof User)
      }

      for (const user of mockRobot.brain.usersForRawFuzzyName('Guy One')) {
        assert.ok(user instanceof User)
      }
    })
  })
})
