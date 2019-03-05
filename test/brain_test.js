'use strict'

/* global describe, beforeEach, afterEach, it */
/* eslint-disable no-unused-expressions */

// Assertions and Stubbing
const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))

const expect = chai.expect

const isCircular = require('is-circular')

// Hubot classes
const Brain = require('../src/brain')
const User = require('../src/user')

describe('Brain', function () {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers()
    this.mockRobot = {
      emit () {},
      on () {}
    }

    // This *should* be callsArgAsync to match the 'on' API, but that makes
    // the tests more complicated and seems irrelevant.
    sinon.stub(this.mockRobot, 'on').withArgs('running').callsArg(1)

    this.brain = new Brain(this.mockRobot)

    this.user1 = this.brain.userForId('1', {name: 'Guy One'})
    this.user2 = this.brain.userForId('2', {name: 'Guy One Two'})
    this.user3 = this.brain.userForId('3', {name: 'Girl Three'})
  })

  afterEach(function () {
    this.clock.restore()
  })

  describe('Unit Tests', function () {
    describe('#mergeData', function () {
      it('performs a proper merge with the new data taking precedent', function () {
        this.brain.data = {
          1: 'old',
          2: 'old'
        }

        this.brain.mergeData({2: 'new'})

        expect(this.brain.data).to.deep.equal({
          1: 'old',
          2: 'new'
        })
      })

      it('emits a loaded event with the new data', function () {
        sinon.spy(this.brain, 'emit')
        this.brain.mergeData({})
        expect(this.brain.emit).to.have.been.calledWith('loaded', this.brain.data)
      })

      it('coerces loaded data into User objects', function () {
        this.brain.mergeData({users: {'4': {'name': 'new', 'id': '4'}}})
        let user = this.brain.userForId('4')
        expect(user.constructor.name).to.equal('User')
        expect(user.id).to.equal('4')
        expect(user.name).to.equal('new')
        expect(isCircular(this.brain)).to.be.false
      })
    })

    describe('#save', () => it('emits a save event', function () {
      sinon.spy(this.brain, 'emit')
      this.brain.save()
      expect(this.brain.emit).to.have.been.calledWith('save', this.brain.data)
    }))

    describe('#resetSaveInterval', () => it('updates the auto-save interval', function () {
      sinon.spy(this.brain, 'save')
      // default is 5s
      this.brain.resetSaveInterval(10)
      // make sure autosave is on
      this.brain.setAutoSave(true)

      this.clock.tick(5000)
      // old interval has passed
      expect(this.brain.save).to.not.have.been.called
      this.clock.tick(5000)
      // new interval has passed
      expect(this.brain.save).to.have.been.calledOnce
    }))

    describe('#close', function () {
      it('saves', function () {
        sinon.spy(this.brain, 'save')
        this.brain.close()
        expect(this.brain.save).to.have.been.calledOnce
      })

      it('emits a close event', function () {
        sinon.spy(this.brain, 'emit')
        this.brain.close()
        expect(this.brain.emit).to.have.been.calledWith('close')
      })

      it('saves before emitting the close event', function () {
        sinon.spy(this.brain, 'save')
        sinon.spy(this.brain, 'emit').withArgs('close')
        this.brain.close()
        expect(this.brain.save).to.have.been.calledBefore(this.brain.emit)
      })

      it('stops auto-saving', function () {
        // make sure autosave is on
        this.brain.setAutoSave(true)
        this.brain.close()

        // set up the spy after because 'close' calls 'save'
        sinon.spy(this.brain, 'save')

        this.clock.tick(2 * 5000)
        expect(this.brain.save).to.not.have.been.called
      })
    })

    describe('#get', function () {
      it('returns the saved value', function () {
        this.brain.data._private['test-key'] = 'value'
        expect(this.brain.get('test-key')).to.equal('value')
      })

      it('returns null if object is not found', function () {
        expect(this.brain.get('not a real key')).to.be.null
      })
    })

    describe('#set', function () {
      it('saves the value', function () {
        this.brain.set('test-key', 'value')
        expect(this.brain.data._private['test-key']).to.equal('value')
      })

      it('sets multiple keys at once if an object is provided', function () {
        this.brain.data._private = {
          key1: 'val1',
          key2: 'val1'
        }

        this.brain.set({
          key2: 'val2',
          key3: 'val2'
        })

        expect(this.brain.data._private).to.deep.equal({
          key1: 'val1',
          key2: 'val2',
          key3: 'val2'
        })
      })

      // Unable to understand why this behavior is needed, but adding a test
      // case to protect it
      it('emits loaded', function () {
        sinon.spy(this.brain, 'emit')
        this.brain.set('test-key', 'value')
        expect(this.brain.emit).to.have.been.calledWith('loaded', this.brain.data)
      })

      it('returns the brain', function () {
        expect(this.brain.set('test-key', 'value')).to.equal(this.brain)
      })
    })

    describe('#remove', () => it('removes the specified key', function () {
      this.brain.data._private['test-key'] = 'value'
      this.brain.remove('test-key')
      expect(this.brain.data._private).to.not.include.keys('test-key')
    }))

    describe('#userForId', function () {
      it('returns the user object', function () {
        expect(this.brain.userForId(1)).to.equal(this.user1)
      })

      it('does an exact match', function () {
        const user4 = this.brain.userForId('FOUR')
        expect(this.brain.userForId('four')).to.not.equal(user4)
      })

      // Cannot understand why this behavior is needed, but adding a test case
      // to protect it
      it('recreates the user if the room option differs from the user object', function () {
        expect(this.brain.userForId(1).room).to.be.undefined

        // undefined -> having a room
        const newUser1 = this.brain.userForId(1, { room: 'room1' })
        expect(newUser1).to.not.equal(this.user1)

        // changing the room
        const newUser2 = this.brain.userForId(1, { room: 'room2' })
        expect(newUser2).to.not.equal(newUser1)
      })

      describe('when there is no matching user ID', function () {
        it('creates a new User', function () {
          expect(this.brain.data.users).to.not.include.key('all-new-user')
          const newUser = this.brain.userForId('all-new-user')
          expect(newUser).to.be.instanceof(User)
          expect(newUser.id).to.equal('all-new-user')
          expect(this.brain.data.users).to.include.key('all-new-user')
        })

        it('passes the provided options to the new User', function () {
          const newUser = this.brain.userForId('all-new-user', {name: 'All New User', prop: 'mine'})
          expect(newUser.name).to.equal('All New User')
          expect(newUser.prop).to.equal('mine')
        })
      })
    })

    describe('#userForName', function () {
      it('returns the user with a matching name', function () {
        expect(this.brain.userForName('Guy One')).to.equal(this.user1)
      })

      it('does a case-insensitive match', function () {
        expect(this.brain.userForName('guy one')).to.equal(this.user1)
      })

      it('returns null if no user matches', function () {
        expect(this.brain.userForName('not a real user')).to.be.null
      })
    })

    describe('#usersForRawFuzzyName', function () {
      it('does a case-insensitive match', function () {
        expect(this.brain.usersForRawFuzzyName('guy')).to.have.members([this.user1, this.user2])
      })

      it('returns all matching users (prefix match) when there is not an exact match (case-insensitive)', function () {
        expect(this.brain.usersForRawFuzzyName('Guy')).to.have.members([this.user1, this.user2])
      })

      it('returns all matching users (prefix match) when there is an exact match (case-insensitive)', function () {
        // Matched case
        expect(this.brain.usersForRawFuzzyName('Guy One')).to.deep.equal([this.user1, this.user2])
        // Mismatched case
        expect(this.brain.usersForRawFuzzyName('guy one')).to.deep.equal([this.user1, this.user2])
      })

      it('returns an empty array if no users match', function () {
        const result = this.brain.usersForRawFuzzyName('not a real user')
        expect(result).to.be.an('array')
        expect(result).to.be.empty
      })
    })

    describe('#usersForFuzzyName', function () {
      it('does a case-insensitive match', function () {
        expect(this.brain.usersForFuzzyName('guy')).to.have.members([this.user1, this.user2])
      })

      it('returns all matching users (prefix match) when there is not an exact match', function () {
        expect(this.brain.usersForFuzzyName('Guy')).to.have.members([this.user1, this.user2])
      })

      it('returns just the user when there is an exact match (case-insensitive)', function () {
        // Matched case
        expect(this.brain.usersForFuzzyName('Guy One')).to.deep.equal([this.user1])
        // Mismatched case
        expect(this.brain.usersForFuzzyName('guy one')).to.deep.equal([this.user1])
      })

      it('returns an empty array if no users match', function () {
        const result = this.brain.usersForFuzzyName('not a real user')
        expect(result).to.be.an('array')
        expect(result).to.be.empty
      })
    })
  })

  describe('Auto-Save', function () {
    it('is on by default', function () {
      expect(this.brain.autoSave).to.equal(true)
    })

    it('automatically saves every 5 seconds when turned on', function () {
      sinon.spy(this.brain, 'save')

      this.brain.setAutoSave(true)

      this.clock.tick(5000)
      expect(this.brain.save).to.have.been.called
    })

    it('does not auto-save when turned off', function () {
      sinon.spy(this.brain, 'save')

      this.brain.setAutoSave(false)

      this.clock.tick(2 * 5000)
      expect(this.brain.save).to.not.have.been.called
    })
  })

  describe('User Searching', function () {
    it('finds users by ID', function () {
      expect(this.brain.userForId('1')).to.equal(this.user1)
    })

    it('finds users by exact name', function () {
      expect(this.brain.userForName('Guy One')).to.equal(this.user1)
    })

    it('finds users by fuzzy name (prefix match)', function () {
      const result = this.brain.usersForFuzzyName('Guy')
      expect(result).to.have.members([this.user1, this.user2])
      expect(result).to.not.have.members([this.user3])
    })

    it('returns User objects, not POJOs', function () {
      expect(this.brain.userForId('1').constructor.name).to.equal('User')
      for (let user of this.brain.usersForFuzzyName('Guy')) {
        expect(user.constructor.name).to.equal('User')
      }

      for (let user of this.brain.usersForRawFuzzyName('Guy One')) {
        expect(user.constructor.name).to.equal('User')
      }

      expect(isCircular(this.brain)).to.be.false
    })
  })
})
