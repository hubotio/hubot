# Assertions and Stubbing
chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

{ expect } = chai

# Hubot classes
{ CatchAllMessage, EnterMessage, TextMessage } = require '../src/message'
{ Listener, TextListener } = require '../src/listener'
Response = require '../src/response.coffee'
User = require '../src/user.coffee'

describe 'Listener', ->
  beforeEach ->
    # Dummy robot (should never actually get called)
    @robot =
      # Why is this part of the Robot object??
      Response: Response

    # Test user
    @user = new User
      id: 1
      name: 'hubottester'
      room: '#mocha'

  describe 'Unit Tests', ->
    describe '#call', ->
      it 'calls the matcher', ->
        callback = sinon.spy()
        testMatcher = sinon.spy()
        testMessage = {}

        testListener = new Listener(@robot, testMatcher, callback)
        testListener.call testMessage

        expect(testMatcher).to.have.been.calledWith(testMessage)

      it 'passes the matcher result on to the listener callback', ->
        matcherResult = {}
        testMatcher = sinon.stub().returns(matcherResult)
        testMessage = {}
        listenerCallback = (response) ->
          expect(response.match).to.be.equal(matcherResult)

        # sanity check; matcherResult must be truthy
        expect(matcherResult).to.be.ok

        testListener = new Listener(@robot, testMatcher, listenerCallback)
        result = testListener.call testMessage

        # sanity check; message should have been processed
        expect(testMatcher).to.have.been.called
        expect(result).to.be.ok

      describe 'if the matcher returns true', ->
        it 'executes the listener callback', ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage

          expect(listenerCallback).to.have.been.called


        it 'returns true', ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          result = testListener.call testMessage

          expect(result).to.be.ok
          

        it 'calls the listener callback with a Response that wraps the Message', (done) ->
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          listenerCallback = (response) ->
            expect(response.message).to.equal(testMessage)
            done()

          testListener = new Listener(@robot, testMatcher, listenerCallback)

          testListener.call testMessage, sinon.spy()

      describe 'if the matcher returns false', ->
        it 'does not execute the listener callback', ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage

          expect(listenerCallback).to.not.have.been.called


        it 'returns false', ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          result = testListener.call testMessage

          expect(result).to.not.be.ok

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
