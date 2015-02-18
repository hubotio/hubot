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
Response = require '../src/response'

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


describe 'Middleware', ->
  beforeEach ->
    @robot = new Robot null, 'mock-adapter', yes, 'TestHubot'
    @robot.run

    # Re-throw AssertionErrors for clearer test failures
    @robot.on 'error', (name, err, response) ->
      if err?.constructor?.name == "AssertionError"
        process.nextTick () ->
          throw err

    @user = @robot.brain.userForId '1', {
      name: 'hubottester'
      room: '#mocha'
    }

  afterEach ->
   @robot.server.close()
   @robot.shutdown()

  # Per the documentation in docs/scripting.md
  # Any new fields that are exposed to middleware should be explicitly
  # tested for.
  describe 'Public API', ->
    beforeEach ->
      # Dummy middleware
      @middleware = sinon.spy (robot, listener, response, next, done) ->
        next(done)

      @robot.listenerMiddleware (robot, listener, response, next, done) =>
        @middleware.call @, robot, listener, response, next, done

      @testMessage = new TextMessage @user, 'message123'
      @robot.hear /^message123$/, (response) ->
      @testListener = @robot.listeners[0]

    describe 'robot', ->
      it 'is the robot object', (testDone) ->
        @robot.receive @testMessage, () =>
          expect(@middleware).to.have.been.calledWithMatch(
            sinon.match.same(@robot) # robot
            sinon.match.any          # listener
            sinon.match.any          # response
            sinon.match.any          # next
            sinon.match.any          # done
          )
          testDone()

    describe 'listener', ->
      it 'is the listener object that matched', (testDone) ->
        @robot.receive @testMessage, () =>
          expect(@middleware).to.have.been.calledWithMatch(
            sinon.match.any                 # robot
            sinon.match.same(@testListener) # listener
            sinon.match.any                 # response
            sinon.match.any                 # next
            sinon.match.any                 # done
          )
          testDone()

      it 'has options.id (metadata)', (testDone) ->
        @robot.receive @testMessage, () =>
          expect(@middleware).to.have.been.calledWithMatch(
            sinon.match.any                    # robot
            sinon.match.has('options',
              sinon.match.has('id'))           # listener
            sinon.match.any                    # response
            sinon.match.any                    # next
            sinon.match.any                    # done
          )
          testDone()

    describe 'response', ->
      it 'is a Response that wraps the message', (testDone) ->
        @robot.receive @testMessage, () =>
          expect(@middleware).to.have.been.calledWithMatch(
            sinon.match.any                       # robot
            sinon.match.any                       # listener
            sinon.match.instanceOf(Response).and(
              sinon.match.has('message',
                sinon.match.same(@testMessage)))  # response
            sinon.match.any                       # next
            sinon.match.any                       # done
          )
          testDone()

    describe 'next', ->
      it 'is a function with arity one', (testDone) ->
        @robot.receive @testMessage, () =>
          expect(@middleware).to.have.been.calledWithMatch(
            sinon.match.any             # robot
            sinon.match.any             # listener
            sinon.match.any             # response
            sinon.match.func.and(
              sinon.match.has('length',
                sinon.match(1)))        # next
            sinon.match.any             # done
          )
          testDone()

    describe 'done', ->
      it 'is a function with arity zero', (testDone) ->
        @robot.receive @testMessage, () =>
          expect(@middleware).to.have.been.calledWithMatch(
            sinon.match.any             # robot
            sinon.match.any             # listener
            sinon.match.any             # response
            sinon.match.any             # next
            sinon.match.func.and(
              sinon.match.has('length',
                sinon.match(0)))        # done
          )
          testDone()
