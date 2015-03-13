# Assertions and Stubbing
chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

{ expect } = chai

mockery = require 'mockery'

# Hubot classes
Robot = require '../src/robot.coffee'
{ CatchAllMessage, EnterMessage, TextMessage } = require '../src/message'
Adapter = require '../src/adapter'

# Preload the Hubot mock adapter but substitute in the latest version of Adapter
mockery.enable()
mockery.registerAllowable 'hubot-mock-adapter'
mockery.registerAllowable 'lodash' # hubot-mock-adapter uses lodash
# Force hubot-mock-adapter to use the latest version of Adapter
mockery.registerMock 'hubot/src/adapter', Adapter
# Load the mock adapter into the cache
require 'hubot-mock-adapter'
# We're done with mockery
mockery.deregisterMock 'hubot/src/adapter'
mockery.disable()


describe 'Robot', ->
  beforeEach ->
    @robot = new Robot null, 'mock-adapter', yes, 'TestHubot'
    @robot.run

    # Re-throw AssertionErrors for clearer test failures
    @robot.on 'error', (name, err, response) ->
      if err.constructor.name == "AssertionError"
        process.nextTick () ->
          throw err

    @user = @robot.brain.userForId '1', {
      name: 'hubottester'
      room: '#mocha'
    }

  afterEach ->
   @robot.server.close()
   @robot.shutdown()

  describe 'Unit Tests', ->
    describe '#receive', ->
      it 'calls all registered listeners', (done) ->
        # Need to use a real Message so that the CatchAllMessage constructor works
        testMessage = new TextMessage(@user, 'message123')

        listener =
          call: (response, cb) ->
            cb()
        sinon.spy(listener, 'call')

        @robot.listeners = [
          listener
          listener
          listener
          listener
        ]

        @robot.receive testMessage, () ->
          # When no listeners match, each listener is called twice: once with
          # the original message and once with a CatchAll message
          expect(listener.call).to.have.callCount(8)
          done()

      it 'sends a CatchAllMessage if no listener matches', (done) ->
        # Testing for recursion with a new CatchAllMessage that wraps the
        # original message

        testMessage = new TextMessage(@user, 'message123')
        @robot.listeners = []

        # Replace @robot.receive so we can catch when the functions recurses
        oldReceive = @robot.receive
        @robot.receive = (message, cb) ->
          expect(message).to.be.instanceof(CatchAllMessage)
          expect(message.message).to.be.equal(testMessage)
          cb()
        sinon.spy(@robot, 'receive')

        # Call the original receive method that we want to test
        oldReceive.call @robot, testMessage, () =>
          expect(@robot.receive).to.have.been.called
          done()

      it 'does not trigger a CatchAllMessage if a listener matches', (done) ->
        testMessage = new TextMessage(@user, 'message123')

        matchingListener =
          call: (message, cb) ->
            # indicate that the message matched the listener
            cb(true)

        # Replace @robot.receive so we can catch if the functions recurses
        oldReceive = @robot.receive
        @robot.receive = sinon.spy()

        @robot.listeners = [
          matchingListener
        ]

        # Call the original receive method that we want to test
        oldReceive.call @robot, testMessage, () ->
          done()

        # Ensure the function did not recurse
        expect(@robot.receive).to.not.have.been.called

      it 'stops processing if a listener marks the message as done', (done) ->
        testMessage = new TextMessage(@user, 'message123')

        matchingListener =
          call: (message, cb) ->
            message.done = true
            # Listener must have matched
            cb(true)

        listenerSpy =
          call: sinon.spy()

        @robot.listeners = [
          matchingListener
          listenerSpy
        ]

        @robot.receive testMessage, () ->
          expect(listenerSpy.call).to.not.have.been.called
          done()

      it 'gracefully handles listener uncaughtExceptions (move on to next listener)', (done) ->
        testMessage = {}
        theError = new Error()

        badListener =
          call: () ->
            throw theError

        goodListenerCalled = false
        goodListener =
          call: (_, cb) ->
            goodListenerCalled = true
            cb(true)

        @robot.listeners = [
          badListener
          goodListener
        ]

        @robot.emit = (name, err, response) ->
          expect(name).to.equal('error')
          expect(err).to.equal(theError)
          expect(response.message).to.equal(testMessage)
        sinon.spy(@robot, 'emit')

        @robot.receive testMessage, () =>
          expect(@robot.emit).to.have.been.called
          expect(goodListenerCalled).to.be.ok
          done()

      it 'executes the callback after the function returns when there are no listeners', (done) ->
        testMessage = new TextMessage @user, 'message123'
        finished = false
        @robot.receive testMessage, ->
          expect(finished).to.be.ok
          done()
        finished = true

    describe '#executeMiddleware', ->
      it 'bails if an invalid middleware set is specified', ->
        testCase = () =>
          @robot.executeMiddleware 'not-a-valid-set', {}, (() ->), (() ->)
        expect(testCase).to.throw /invalid.*not-a-valid-set/i

      it 'executes all registered middleware in definition order', (testDone) ->
        testListener = {}
        testResponse = {}

        middlewareExecution = []

        testMiddlewareA = (robot, listener, response, next, done) =>
          # Check that variables get passed correctly
          expect(robot).to.equal(@robot)
          expect(listener).to.equal(testListener)
          expect(response).to.equal(testResponse)

          middlewareExecution.push('A')
          next(done)

        testMiddlewareB = (robot, listener, response, next, done) ->
          middlewareExecution.push('B')
          next(done)

        @robot.listenerMiddleware testMiddlewareA
        @robot.listenerMiddleware testMiddlewareB

        middlewareFinished = (context, done) ->
          expect(middlewareExecution).to.deep.equal(['A','B'])
          testDone()
        middlewareFailed = sinon.spy()

        @robot.executeMiddleware 'listener',
          {listener: testListener, response: testResponse},
          middlewareFinished,
          middlewareFailed

      it 'works with asynchronous middleware', (testDone) ->
        testMiddleware = sinon.spy (robot, listener, response, next, done) ->
          # Yield to the event loop
          process.nextTick () ->
            next(done)

        @robot.listenerMiddleware testMiddleware

        middlewareFinished = (context, done) ->
          expect(testMiddleware).to.have.been.called
          testDone()

        @robot.executeMiddleware 'listener',
          {},
          middlewareFinished,
          sinon.spy()

      it 'executes the next callback after the function returns when there is no middleware', (done) ->
        finished = false
        @robot.executeMiddleware 'listener',
          {},
          (->
            expect(finished).to.be.ok
            done()),
          sinon.spy()
        finished = true

      it 'always executes middleware after the function returns', (testDone) ->
        finished = false

        @robot.listenerMiddleware (robot, listener, response, next, done) ->
          expect(finished).to.be.ok
          testDone()

        @robot.executeMiddleware 'listener', {}, sinon.spy(), sinon.spy()
        finished = true

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

          @robot.listenerMiddleware testMiddlewareA
          @robot.listenerMiddleware testMiddlewareB
          @robot.listenerMiddleware testMiddlewareC

          # Don't care about emit
          @robot.emit = () ->
          middlewareFinished = sinon.spy()
          middlewareFailed = () =>
            expect(middlewareFinished).to.not.have.been.called
            expect(middlewareExecution).to.deep.equal(['A','B'])
            testDone()

          @robot.executeMiddleware 'listener',
            {},
            middlewareFinished,
            middlewareFailed

        it 'emits an error event', (testDone) ->
          testResponse = {}
          theError = new Error

          testMiddleware = (robot, listener, response, next, done) ->
            throw theError

          @robot.listenerMiddleware testMiddleware

          @robot.emit = sinon.spy (name, err, response) ->
            expect(name).to.equal('error')
            expect(err).to.equal(theError)
            expect(response).to.equal(testResponse)

          middlewareFinished = sinon.spy()
          middlewareFailed = () =>
            expect(@robot.emit).to.have.been.called
            testDone()

          @robot.executeMiddleware 'listener',
            {response: testResponse},
            middlewareFinished,
            middlewareFailed

        it 'unwinds the middleware stack (calling all done functions)', (testDone) ->
          extraDoneFunc = null

          testMiddlewareA = (robot, listener, response, next, done) ->
            # Goal: make sure that the middleware stack is unwound correctly
            extraDoneFunc = sinon.spy () ->
              done()
            next extraDoneFunc

          testMiddlewareB = (robot, listener, response, next, done) ->
            throw new Error

          @robot.listenerMiddleware testMiddlewareA
          @robot.listenerMiddleware testMiddlewareB

          # Don't care about emit
          @robot.emit = () ->
          middlewareFinished = sinon.spy()
          middlewareFailed = () ->
            # Sanity check that the error was actually thrown
            expect(middlewareFinished).to.not.have.been.called

            expect(extraDoneFunc).to.have.been.called
            testDone()

          @robot.executeMiddleware 'listener',
            {},
            middlewareFinished,
            middlewareFailed

      it 'does the right thing with done callbacks', (testDone) ->
        # we want to ensure that the 'done' callbacks are nested correctly
        # (executed in reverse order of definition)
        execution = []

        testMiddlewareA = (robot, listener, response, next, done) ->
          execution.push 'middlewareA'
          next () ->
            execution.push 'doneA'
            done()

        testMiddlewareB = (robot, listener, response, next, done) ->
          execution.push 'middlewareB'
          next () ->
            execution.push 'doneB'
            done()

        @robot.listenerMiddleware testMiddlewareA
        @robot.listenerMiddleware testMiddlewareB

        allDone = () ->
          expect(execution).to.deep.equal(['middlewareA', 'middlewareB', 'doneB', 'doneA'])
          testDone()

        @robot.executeMiddleware 'listener',
          {},
          # Short circuit at the bottom of the middleware stack
          (context, done) -> done(),
          allDone

  describe 'Message Processing', ->
    it 'calls a matching listener', (done) ->
      testMessage = new TextMessage(@user, 'message123')
      @robot.hear /^message123$/, (response) ->
        expect(response.message).to.equal(testMessage)
        done()
      @robot.receive testMessage

    it 'calls multiple matching listeners', (done) ->
      testMessage = new TextMessage(@user, 'message123')

      listenersCalled = 0
      listenerCallback = (response) ->
        expect(response.message).to.equal(testMessage)
        listenersCalled++

      @robot.hear /^message123$/, listenerCallback
      @robot.hear /^message123$/, listenerCallback

      @robot.receive testMessage, () ->
        expect(listenersCalled).to.equal(2)
        done()

    it 'calls the catch-all listener if no listeners match', (done) ->
      testMessage = new TextMessage(@user, 'message123')

      listenerCallback = sinon.spy()
      @robot.hear /^no-matches$/, listenerCallback

      @robot.catchAll (response) ->
        expect(listenerCallback).to.not.have.been.called
        expect(response.message).to.equal(testMessage)
        done()

      @robot.receive testMessage

    it 'does not call the catch-all listener if any listener matched', (done) ->
      testMessage = new TextMessage(@user, 'message123')

      listenerCallback = sinon.spy()
      @robot.hear /^message123$/, listenerCallback

      catchAllCallback = sinon.spy()
      @robot.catchAll catchAllCallback

      @robot.receive testMessage, () ->
        expect(listenerCallback).to.have.been.called.once
        expect(catchAllCallback).to.not.have.been.called
        done()

    it 'stops processing if message.finish() is called synchronously', (done) ->
      testMessage = new TextMessage(@user, 'message123')

      @robot.hear /^message123$/, (response) ->
        response.message.finish()

      listenerCallback = sinon.spy()
      @robot.hear /^message123$/, listenerCallback

      @robot.receive testMessage, () ->
        expect(listenerCallback).to.not.have.been.called
        done()

    it 'calls non-TextListener objects', (done) ->
      testMessage = new EnterMessage @user

      @robot.enter (response) ->
        expect(response.message).to.equal(testMessage)
        done()

      @robot.receive testMessage

    it 'gracefully handles listener uncaughtExceptions (move on to next listener)', (done) ->
      testMessage = new TextMessage @user, 'message123'
      theError = new Error()

      @robot.hear /^message123$/, () ->
        throw theError

      goodListenerCalled = false
      @robot.hear /^message123$/, () ->
        goodListenerCalled = true

      [badListener,goodListener] = @robot.listeners

      @robot.emit = (name, err, response) ->
        expect(name).to.equal('error')
        expect(err).to.equal(theError)
        expect(response.message).to.equal(testMessage)
      sinon.spy(@robot, 'emit')

      @robot.receive testMessage, () =>
        expect(@robot.emit).to.have.been.called
        expect(goodListenerCalled).to.be.ok
        done()

    describe 'Listener Middleware', ->
      it 'allows listener callback execution', (testDone) ->
        listenerCallback = sinon.spy()
        @robot.hear /^message123$/, listenerCallback
        @robot.listenerMiddleware (robot, listener, response, next, done) ->
          # Allow Listener callback execution
          next done

        testMessage = new TextMessage @user, 'message123'
        @robot.receive testMessage, () ->
          expect(listenerCallback).to.have.been.called
          testDone()

      it 'can block listener callback execution', (testDone) ->
        listenerCallback = sinon.spy()
        @robot.hear /^message123$/, listenerCallback
        @robot.listenerMiddleware (robot, listener, response, next, done) ->
          # Block Listener callback execution
          done()

        testMessage = new TextMessage @user, 'message123'
        @robot.receive testMessage, () ->
          expect(listenerCallback).to.not.have.been.called
          testDone()

      it 'receives the correct arguments', (testDone) ->
        @robot.hear /^message123$/, () ->
        testListener = @robot.listeners[0]
        testMessage = new TextMessage @user, 'message123'

        @robot.listenerMiddleware (robot, listener, response, next, done) =>
          # Escape middleware error handling for clearer test failures
          process.nextTick () =>
            expect(robot).to.equal(@robot)
            expect(listener).to.equal(testListener)
            expect(response.message).to.equal(testMessage)
            expect(next).to.be.a('function')
            expect(done).to.be.a('function')
            testDone()

        @robot.receive testMessage

      it 'executes middleware in order of definition', (testDone) ->
        execution = []

        testMiddlewareA = (robot, listener, response, next, done) ->
          execution.push 'middlewareA'
          next () ->
            execution.push 'doneA'
            done()

        testMiddlewareB = (robot, listener, response, next, done) ->
          execution.push 'middlewareB'
          next () ->
            execution.push 'doneB'
            done()

        @robot.listenerMiddleware testMiddlewareA
        @robot.listenerMiddleware testMiddlewareB

        @robot.hear /^message123$/, () ->
          execution.push 'listener'

        testMessage = new TextMessage @user, 'message123'
        @robot.receive testMessage, () ->
          expect(execution).to.deep.equal([
            'middlewareA'
            'middlewareB'
            'listener'
            'doneB'
            'doneA'
          ])
          testDone()
