chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

Brain = require '../src/brain.coffee'

describe "Brain", ->

  beforeEach ->
    @clock = sinon.useFakeTimers()

  afterEach ->
    @clock.restore()

  describe 'new', ->
    beforeEach ->
      @brain = new Brain

    it 'has data for users and private', ->
      expect(@brain.data).to.have.keys('users', '_private')

    it 'waits to be connected before setting a save interval', ->
      expect(@brain.saveInterval).to.not.exist

    it 'sets save interval to 5 seconds after being connected', ->
      @brain.resetSaveInterval = sinon.spy()

      expect(@brain.resetSaveInterval).to.not.have.been.called
      @brain.emit('connected')
      expect(@brain.resetSaveInterval).to.have.been.calledWith(5)

  describe 'resetSaveInterval', ->
    beforeEach ->
      @brain = new Brain
      @saveSpy = sinon.spy()
      @brain.on 'save', @saveSpy

    it 'remembers the interval', ->
      @brain.resetSaveInterval(1)

      expect(@brain.saveInterval).to.exist

    it 'actually sets an interval', ->
      @brain.resetSaveInterval(1)

      expect(@clock.timeouts).to.have.property(@brain.saveInterval)

    it 'clears a previous interval', ->
      @brain.resetSaveInterval(1)
      oldSaveInterval = @brain.saveInterval
      @brain.resetSaveInterval(1)

      expect(@clock.timeouts).to.not.have.property(oldSaveInterval)

    it 'does not save before the interval but saves after the interval', ->
      @brain.resetSaveInterval(5)

      @clock.tick(4999)
      expect(@saveSpy).to.have.not.been.called

      @clock.tick(2)
      expect(@saveSpy).to.have.been.called

  describe 'saving', ->
    beforeEach ->
      @brain = new Brain

    it 'emits save', ->
      save = sinon.spy()
      @brain.on 'save', save

      @brain.save()

      expect(save).to.have.been.called
