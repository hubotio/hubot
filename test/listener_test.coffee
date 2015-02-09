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
      # Ignore log messages
      logger:
        debug: () ->
      # Setting an internal Robot variable feels dirty...
      middleware:
        listener: []
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

      it 'bails if there is no callback', ->
        testMatcher = sinon.spy()
        listenerCallback = sinon.spy()
        testListener = new Listener(@robot, testMatcher, listenerCallback)
        testMessage = {}
        expect(() -> testListener.call(testMessage, undefined)).to.throw(Error)

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


        it 'calls the provided callback with true', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage, (result) ->
            expect(result).to.be.ok
            done()

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

        it 'calls the listener callback with a Response that wraps the Message', (done) ->
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          listenerCallback = (response) ->
            expect(response.message).to.equal(testMessage)
            done()

          testListener = new Listener(@robot, testMatcher, listenerCallback)

          testListener.call testMessage, sinon.spy()

        it 'passes through #executeAllMiddleware', (testDone) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.executeAllMiddleware = (response, next, done) ->
            expect(response.message).to.be.equal(testMessage)
            expect(next).to.be.a('function')
            expect(done).to.be.a('function')
            testDone()

          testListener.call(testMessage, sinon.spy())

        it 'executes the listener callback if middleware succeeds', (testDone) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(true)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.executeAllMiddleware = (response, next, done) ->
            # Middleware succeeds
            next(response, done)

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
          testListener.executeAllMiddleware = (response, next, done) ->
            # Middleware fails
            done()

          testListener.call testMessage, (result) ->
            expect(listenerCallback).to.not.have.been.called
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


        it 'calls the provided callback with false', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.call testMessage, (result) ->
            expect(result).to.not.be.ok
            done()

        it 'does not execute any middleware', (done) ->
          listenerCallback = sinon.spy()
          testMatcher = sinon.stub().returns(false)
          testMessage = {}

          testListener = new Listener(@robot, testMatcher, listenerCallback)
          testListener.executeAllMiddleware = sinon.stub()

          testListener.call testMessage, (result) ->
            expect(testListener.executeAllMiddleware).to.not.have.been.called
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

    describe '#executeAllMiddleware', ->
      beforeEach ->
        @testListener = new Listener(@robot, sinon.spy(), {}, sinon.spy())

      it 'executes all registered middleware in definition order', (testDone) ->
        middlewareExecution = []

        testMiddlewareA = (robot, listener, response, next, done) =>
          # Check that variables get passed correctly
          expect(robot).to.equal(@robot)
          expect(listener).to.equal(@testListener)
          expect(response).to.equal(testResponse)

          middlewareExecution.push('A')
          next(done)

        testMiddlewareB = (robot, listener, response, next, done) ->
          middlewareExecution.push('B')
          next(done)

        @robot.middleware.listener = [
          testMiddlewareA
          testMiddlewareB
        ]

        testResponse = {}

        middlewareFinished = (response, done) ->
          expect(middlewareExecution).to.deep.equal(['A','B'])
          testDone()
        middlewareFailed = sinon.spy()

        @testListener.executeAllMiddleware(testResponse, middlewareFinished, middlewareFailed)

      it 'works with asynchronous middleware', (testDone) ->
        testMiddleware = sinon.spy (robot, listener, response, next, done) ->
          # Yield to the event loop
          process.nextTick () ->
            next(done)

        @robot.middleware.listener = [
          testMiddleware
        ]

        middlewareFinished = (response, done) ->
          expect(testMiddleware).to.have.been.called
          testDone()

        testResponse = {}
        @testListener.executeAllMiddleware(testResponse, middlewareFinished, sinon.spy())

      describe 'error handling', ->
        it 'does not execute subsequent middleware after the error is thrown', (testDone) ->
          middlewareExecution = []

          testMiddlewareA = (robot, listener, response, next, done) ->
            middlewareExecution.push('A')
            next(done)

          testMiddlewareB = (robot, listener, response, next, done) ->
            middlewareExecution.push('B')
            throw new Error

          testMiddlewareC = (robot, listener, response, next, done) ->
            middlewareExecution.push('C')
            next(done)

          @robot.middleware.listener = [
            testMiddlewareA
            testMiddlewareB
            testMiddlewareC
          ]

          # Don't care about emit
          @robot.emit = () ->
          middlewareFinished = sinon.spy()
          middlewareFailed = (response, done) =>
            expect(middlewareFinished).to.not.have.been.called
            expect(middlewareExecution).to.deep.equal(['A','B'])
            testDone()

          @testListener.executeAllMiddleware({}, middlewareFinished, middlewareFailed)


        it 'emits an error event', (testDone) ->
          testResponse = {}
          theError = new Error

          testMiddleware = (robot, listener, response, next, done) ->
            throw theError

          @robot.middleware.listener = [
            testMiddleware
          ]

          @robot.emit = sinon.spy (name, err, response) ->
            expect(name).to.equal('error')
            expect(err).to.equal(theError)
            expect(response).to.equal(testResponse)

          middlewareFinished = sinon.spy()
          middlewareFailed = (response, done) =>
            expect(@robot.emit).to.have.been.called
            testDone()

          @testListener.executeAllMiddleware(testResponse, middlewareFinished, middlewareFailed)


        it 'unwinds the middleware stack (calling all done functions)', (testDone) ->
          extraDoneFunc = null

          testMiddlewareA = (robot, listener, response, next, done) ->
            # Goal: make sure that the middleware stack is unwound correctly
            extraDoneFunc = sinon.spy () ->
              done()
            next extraDoneFunc

          testMiddlewareB = (robot, listener, response, next, done) ->
            throw new Error

          @robot.middleware.listener = [
            testMiddlewareA
            testMiddlewareB
          ]

          # Don't care about emit
          @robot.emit = () ->
          middlewareFinished = sinon.spy()
          middlewareFailed = (response, done) ->
            # Sanity check that the error was actually thrown
            expect(middlewareFinished).to.not.have.been.called

            expect(extraDoneFunc).to.have.been.called
            testDone()

          @testListener.executeAllMiddleware({}, middlewareFinished, middlewareFailed)

      it 'does the right thing with done callbacks??'
        # not exactly sure what to test here, but we want to ensure that
        # the 'done' callbacks are nested correctly (executed in reverse
        # order of definition)

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
