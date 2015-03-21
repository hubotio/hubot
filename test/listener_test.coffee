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
    # Dummy robot
    @robot =
      # Re-throw AssertionErrors for clearer test failures
      emit: (name, err, response) ->
        if err.constructor.name == "AssertionError"
          process.nextTick () ->
            throw err
      # Ignore log messages
      logger:
        debug: () ->
      # Why is this part of the Robot object??
      Response: Response

    # Test user
    @user = new User
      id: 1
      name: 'hubottester'
      room: '#mocha'

  describe 'Unit Tests', ->
    describe '#call', ->
      it 'calls the matcher', (done) ->
        callback = sinon.spy()
        testMatcher = sinon.spy()
        testMessage = {}

        testListener = new Listener(@robot, testMatcher, callback)
        testListener.call testMessage, (_) ->
          expect(testMatcher).to.have.been.calledWith(testMessage)
          done()

      it 'passes the matcher result on to the listener callback', (done) ->
        matcherResult = {}
        testMatcher = sinon.stub().returns(matcherResult)
        testMessage = {}
        listenerCallback = (response) ->
          expect(response.match).to.be.equal(matcherResult)

        # sanity check; matcherResult must be truthy
        expect(matcherResult).to.be.ok

        testListener = new Listener(@robot, testMatcher, listenerCallback)
        testListener.call testMessage, (result) ->
          # sanity check; message should have been processed
          expect(testMatcher).to.have.been.called
          expect(result).to.be.ok

          done()

      describe 'if the matcher returns true', ->
        it 'executes the listener callback', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage, (_) ->
            expect(listenerCallback).to.have.been.called
            done()


        it 'returns true', () ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          result = testListener.call testMessage
          expect(result).to.be.ok

        it 'calls the provided callback with true', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage, (result) ->
            expect(result).to.be.ok
            done()

        it 'calls the provided callback after the function returns', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          finished = false
          testListener.call testMessage, (result) ->
            expect(finished).to.be.ok
            done()
          finished = true

        it 'handles uncaught errors from the listener callback', (done) ->
          testMatcher = sinon.stub().returns(true)
          testMessage = {}
          theError = new Error()

          listenerCallback = (response) ->
            throw theError

          @robot.emit = (name, err, response) ->
            expect(name).to.equal('error')
            expect(err).to.equal(theError)
            expect(response.message).to.equal(testMessage)
            done()

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage, sinon.spy()

        it 'calls the provided callback with true if there is an error thrown by the listener callback', (done) ->
          testMatcher = sinon.stub().returns(true)
          testMessage = {}
          theError = new Error()

          listenerCallback = (response) ->
            throw theError

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage, (result) ->
            expect(result).to.be.ok
            done()

        it 'calls the listener callback with a Response that wraps the Message', (done) ->
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          listenerCallback = (response) ->
            expect(response.message).to.equal(testMessage)
            done()

          testListener = new Listener(@robot, testMatcher, listenerCallback)

          testListener.call testMessage, sinon.spy()

        it 'passes through the provided middleware stack', (testDone) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testMiddleware =
            execute: (context, next, done) ->
              expect(context.listener).to.be.equal(testListener)
              expect(context.response).to.be.instanceof(Response)
              expect(context.response.message).to.be.equal(testMessage)
              expect(next).to.be.a('function')
              expect(done).to.be.a('function')
              testDone()

          testListener.call(testMessage, testMiddleware, sinon.spy())

        it 'executes the listener callback if middleware succeeds', (testDone) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)

          testListener.call testMessage, (result) ->
            expect(listenerCallback).to.have.been.called
            # Matcher matched, so we return true
            expect(result).to.be.ok
            testDone()

        it 'does not execute the listener callback if middleware fails', (testDone) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testMiddleware =
            execute: (context, next, done) ->
              # Middleware fails
              done()

          testListener.call testMessage, testMiddleware, (result) ->
            expect(listenerCallback).to.not.have.been.called
            # Matcher still matched, so we return true
            expect(result).to.be.ok
            testDone()

        it 'unwinds the middleware stack if there is an error in the listener callback', (testDone) ->
          listenerCallback = sinon.stub().throws(new Error())
          testMatcher = sinon.stub().returns(true)
          testMessage = {}
          extraDoneFunc = null

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testMiddleware =
            execute: (context, next, done) ->
              extraDoneFunc = sinon.spy done
              next context, extraDoneFunc

          testListener.call testMessage, testMiddleware, (result) ->
            # Listener callback was called (and failed)
            expect(listenerCallback).to.have.been.called
            # Middleware stack was unwound correctly
            expect(extraDoneFunc).to.have.been.called
            # Matcher still matched, so we return true
            expect(result).to.be.ok
            testDone()


      describe 'if the matcher returns false', ->
        it 'does not execute the listener callback', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage, (_) ->
            expect(listenerCallback).to.not.have.been.called
            done()


        it 'returns false', () ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          result = testListener.call testMessage
          expect(result).to.not.be.ok

        it 'calls the provided callback with false', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage, (result) ->
            expect(result).to.not.be.ok
            done()

        it 'calls the provided callback after the function returns', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          finished = false
          testListener.call testMessage, (result) ->
            expect(finished).to.be.ok
            done()
          finished = true

        it 'does not execute any middleware', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testMiddleware =
            execute: sinon.spy()

          testListener.call testMessage, (result) =>
            expect(testMiddleware.execute).to.not.have.been.called
            done()

    describe '#constructor', ->
      it 'requires a matcher', ->
        expect(() -> new Listener(@robot, undefined, {}, sinon.spy())).to.throw(Error)

      it 'requires a callback', ->
        # No options
        expect(() -> new Listener(@robot, sinon.spy(), undefined)).to.throw(Error)
        # With options
        expect(() -> new Listener(@robot, sinon.spy(), {}, undefined)).to.throw(Error)

      it 'gracefully handles missing options', ->
        testMatcher = sinon.spy()
        listenerCallback = sinon.spy()
        testListener = new Listener(@robot, testMatcher, listenerCallback)
        # slightly brittle because we are testing for the default options Object
        expect(testListener.options).to.deep.equal({id:null})
        expect(testListener.callback).to.be.equal(listenerCallback)

      it 'gracefully handles a missing ID (set to null)', ->
        testMatcher = sinon.spy()
        listenerCallback = sinon.spy()
        testListener = new Listener(@robot, testMatcher, {}, listenerCallback)
        expect(testListener.options.id).to.be.null

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
