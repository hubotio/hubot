# Assertions and Stubbing
chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

{ expect } = chai

# Hubot classes
Brain = require '../src/brain.coffee'
User = require '../src/user.coffee'

describe 'Brain', ->
  beforeEach ->
    @clock = sinon.useFakeTimers()
    @mockRobot =
      emit: ->
      on: ->

    # This *should* be callsArgAsync to match the 'on' API, but that makes
    # the tests more complicated and seems irrelevant.
    sinon.stub(@mockRobot, 'on').withArgs('running').callsArg(1)

    @brain = new Brain @mockRobot

    @user1 = @brain.userForId '1', name: 'Guy One'
    @user2 = @brain.userForId '2', name: 'Guy One Two'
    @user3 = @brain.userForId '3', name: 'Girl Three'

  afterEach ->
    @clock.restore()

  describe 'Unit Tests', ->
    describe '#mergeData', ->
      it 'performs a proper merge with the new data taking precedent', ->
        @brain.data =
          1: 'old'
          2: 'old'

        @brain.mergeData
          2: 'new'

        expect(@brain.data).to.deep.equal
          1: 'old'
          2: 'new'

       it 'emits a loaded event with the new data', ->
         sinon.spy @brain, 'emit'
         @brain.mergeData {}
         expect(@brain.emit).to.have.been.calledWith('loaded', @brain.data)

    describe '#save', ->
      it 'emits a save event', ->
        sinon.spy @brain, 'emit'
        @brain.save()
        expect(@brain.emit).to.have.been.calledWith('save', @brain.data)

    describe '#resetSaveInterval', ->
      it 'updates the auto-save interval', ->
        sinon.spy @brain, 'save'
        # default is 5s
        @brain.resetSaveInterval 10
        # make sure autosave is on
        @brain.setAutoSave true

        @clock.tick(5000)
        # old interval has passed
        expect(@brain.save).to.not.have.been.called
        @clock.tick(5000)
        # new interval has passed
        expect(@brain.save).to.have.been.calledOnce

    describe '#close', ->
      it 'saves', ->
        sinon.spy @brain, 'save'
        @brain.close()
        expect(@brain.save).to.have.been.calledOnce

      it 'emits a close event', ->
        sinon.spy @brain, 'emit'
        @brain.close()
        expect(@brain.emit).to.have.been.calledWith('close')

      it 'saves before emitting the close event', ->
        sinon.spy(@brain, 'save')
        sinon.spy(@brain, 'emit').withArgs('close')
        @brain.close()
        expect(@brain.save).to.have.been.calledBefore(@brain.emit)

      it 'stops auto-saving', ->
        # make sure autosave is on
        @brain.setAutoSave true
        @brain.close()

        # set up the spy after because 'close' calls 'save'
        sinon.spy @brain, 'save'

        @clock.tick(2*5000)
        expect(@brain.save).to.not.have.been.called

    describe '#get', ->
      it 'returns the saved value', ->
        @brain.data._private['test-key'] = 'value'
        expect(@brain.get('test-key')).to.equal('value')

      it 'returns null if object is not found', ->
        expect(@brain.get('not a real key')).to.be.null

    describe '#set', ->
      it 'saves the value', ->
        @brain.set('test-key', 'value')
        expect(@brain.data._private['test-key']).to.equal('value')

      it 'sets multiple keys at once if an object is provided', ->
        @brain.data._private =
          key1: 'val1'
          key2: 'val1'

        @brain.set
          key2: 'val2'
          key3: 'val2'

        expect(@brain.data._private).to.deep.equal
          key1: 'val1'
          key2: 'val2'
          key3: 'val2'

      # Unable to understand why this behavior is needed, but adding a test
      # case to protect it
      it 'emits loaded', ->
        sinon.spy @brain, 'emit'
        @brain.set('test-key', 'value')
        expect(@brain.emit).to.have.been.calledWith('loaded', @brain.data)

      it 'returns the brain', ->
        expect(@brain.set('test-key', 'value')).to.equal(@brain)

    describe '#remove', ->
      it 'removes the specified key', ->
        @brain.data._private['test-key'] = 'value'
        @brain.remove 'test-key'
        expect(@brain.data._private).to.not.include.keys('test-key')

    describe '#userForId', ->
      it 'returns the user object', ->
        expect(@brain.userForId(1)).to.equal(@user1)

      it 'does an exact match', ->
        user4 = @brain.userForId('FOUR')
        expect(@brain.userForId('four')).to.not.equal(user4)

      # Cannot understand why this behavior is needed, but adding a test case
      # to protect it
      it 'recreates the user if the room option differs from the user object', ->
        expect(@brain.userForId(1).room).to.be.undefined

        # undefined -> having a room
        newUser1 = @brain.userForId(1, room: 'room1')
        expect(newUser1).to.not.equal(@user1)

        # changing the room
        newUser2 = @brain.userForId(1, room: 'room2')
        expect(newUser2).to.not.equal(newUser1)

      describe 'when there is no matching user ID', ->
        it 'creates a new User', ->
          expect(@brain.data.users).to.not.include.key('all-new-user')
          newUser = @brain.userForId('all-new-user')
          expect(newUser).to.be.instanceof(User)
          expect(newUser.id).to.equal('all-new-user')
          expect(@brain.data.users).to.include.key('all-new-user')

        it 'passes the provided options to the new User', ->
          newUser = @brain.userForId('all-new-user', name: 'All New User', prop: 'mine')
          expect(newUser.name).to.equal('All New User')
          expect(newUser.prop).to.equal('mine')

    describe '#userForName', ->
      it 'returns the user with a matching name', ->
        expect(@brain.userForName('Guy One')).to.equal(@user1)

      it 'does a case-insensitive match', ->
        expect(@brain.userForName('guy one')).to.equal(@user1)

      it 'returns null if no user matches', ->
        expect(@brain.userForName('not a real user')).to.be.null

    describe '#usersForRawFuzzyName', ->
      it 'does a case-insensitive match', ->
        expect(@brain.usersForRawFuzzyName('guy')).to.have.members([@user1,@user2])

      it 'returns all matching users (prefix match) when there is not an exact match (case-insensitive)', ->
        expect(@brain.usersForRawFuzzyName('Guy')).to.have.members([@user1,@user2])

      it 'returns all matching users (prefix match) when there is an exact match (case-insensitive)', ->
        # Matched case
        expect(@brain.usersForRawFuzzyName('Guy One')).to.deep.equal([@user1,@user2])
        # Mismatched case
        expect(@brain.usersForRawFuzzyName('guy one')).to.deep.equal([@user1,@user2])

      it 'returns an empty array if no users match', ->
        result = @brain.usersForRawFuzzyName('not a real user')
        expect(result).to.be.an('array')
        expect(result).to.be.empty

    describe '#usersForFuzzyName', ->
      it 'does a case-insensitive match', ->
        expect(@brain.usersForFuzzyName('guy')).to.have.members([@user1,@user2])

      it 'returns all matching users (prefix match) when there is not an exact match', ->
        expect(@brain.usersForFuzzyName('Guy')).to.have.members([@user1,@user2])

      it 'returns just the user when there is an exact match (case-insensitive)', ->
        # Matched case
        expect(@brain.usersForFuzzyName('Guy One')).to.deep.equal([@user1])
        # Mismatched case
        expect(@brain.usersForFuzzyName('guy one')).to.deep.equal([@user1])

      it 'returns an empty array if no users match', ->
        result = @brain.usersForFuzzyName('not a real user')
        expect(result).to.be.an('array')
        expect(result).to.be.empty

  describe 'Auto-Save', ->
    it 'is on by default', ->
      expect(@brain.autoSave).to.equal(true)

    it 'automatically saves every 5 seconds when turned on', ->
      sinon.spy @brain, 'save'

      @brain.setAutoSave true

      @clock.tick(5000)
      expect(@brain.save).to.have.been.called

    it 'does not auto-save when turned off', ->
      sinon.spy @brain, 'save'

      @brain.setAutoSave false

      @clock.tick(2*5000)
      expect(@brain.save).to.not.have.been.called

  describe 'User Searching', ->
    it 'finds users by ID', ->
      expect(@brain.userForId('1')).to.equal(@user1)

    it 'finds users by exact name', ->
      expect(@brain.userForName('Guy One')).to.equal(@user1)

    it 'finds users by fuzzy name (prefix match)', ->
      result = @brain.usersForFuzzyName('Guy')
      expect(result).to.have.members([@user1, @user2])
      expect(result).to.not.have.members([@user3])
