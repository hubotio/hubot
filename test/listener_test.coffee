# Assertions and Stubbing
chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

{ expect } = chai

# Hubot classes
Robot = require '../src/robot.coffee'
{ CatchAllMessage, EnterMessage, TextMessage } = require '../src/message'
{ Listener, TextListener } = require '../src/listener'

describe 'Listener', ->
  beforeEach ->
    @robot = new Robot null, 'mock-adapter', yes, 'TestHubot'
    @robot.run

    @user = @robot.brain.userForId '1', {
      name: 'hubottester'
      room: '#mocha'
    }

  afterEach ->
   @robot.server.close()
   @robot.shutdown()

  describe 'Unit Tests', ->
    describe '#call', ->
      it 'calls the matcher', ->
        callback = sinon.spy()
        testMatcher = sinon.spy()
        testMessage = {}

        testListener = new Listener(@robot, testMatcher, callback)
        testListener.call testMessage

        expect(testMatcher).to.have.been.calledWith(testMessage)

      it 'executes the callback and returns true if the matcher returns true', ->
        callback = sinon.spy()
        testMatcher = (message) ->
          expect(message).to.be.equal(testMessage)
          return true
        testMessage = {}

        testListener = new Listener(@robot, testMatcher, callback)
        result = testListener.call(testMessage)

        expect(result).to.be.ok
        expect(callback).to.have.been.called

      it 'does not execute the callback and returns false if the matcher returns false', ->
        callback = sinon.spy()
        testMatcher = (message) ->
          expect(message).to.be.equal(testMessage)
          return false
        testMessage = {}

        testListener = new Listener(@robot, testMatcher, callback)
        result = testListener.call(testMessage)

        expect(result).to.not.be.ok
        expect(callback).to.not.have.been.called

      it 'passes the matcher result on to the callback', ->
        matcherResult = {}
        testMatcher = sinon.stub().returns(matcherResult)
        testMessage = {}
        callback = (response) ->
          expect(response.match).to.be.equal(matcherResult)

        # sanity check; matcherResult must be truthy
        expect(matcherResult).to.be.ok

        testListener = new Listener(@robot, testMatcher, callback)
        result = testListener.call(testMessage)

        # sanity check; message should have been processed
        expect(testMatcher).to.have.been.called
        expect(result).to.be.ok

    describe 'TextListener', ->
      describe '#matcher', ->
        it 'matches TextMessages', ->
          callback = sinon.spy()
          testMessage = new TextMessage(@user, 'test')
          testMessage.match = sinon.stub().returns(true)
          testRegex = /test/
 
          testListener = new TextListener(@robot, testRegex, callback)
          result = testListener.matcher(testMessage)
 
          expect(result).to.be.ok
          expect(testMessage.match).to.have.been.calledWith(testRegex)
 
        it 'does not match EnterMessages', ->
          callback = sinon.spy()
          testMessage = new EnterMessage(@user)
          testMessage.match = sinon.stub().returns(true)
          testRegex = /test/
 
          testListener = new TextListener(@robot, testRegex, callback)
          result = testListener.matcher(testMessage)
 
          expect(result).to.not.be.ok
          expect(testMessage.match).to.not.have.been.called
