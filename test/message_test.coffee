# Assertions and Stubbing
chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

{ expect } = chai

# Hubot classes
Robot = require '../src/robot.coffee'
{ CatchAllMessage, EnterMessage, Message, TextMessage } = require '../src/message'

describe 'Message', ->
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
    describe '#finish', ->
      it 'marks the message as done', ->
        testMessage = new Message(@user)
        expect(testMessage.done).to.not.be.ok
        testMessage.finish()
        expect(testMessage.done).to.be.ok

    describe 'TextMessage', ->
      describe '#match', ->
        it 'should perform standard regex matching', ->
          testMessage = new TextMessage(@user, 'message123')
          expect( testMessage.match(/^message123$/) ).to.be.ok
          expect( testMessage.match(/^does-not-match$/) ).to.not.be.ok

  describe 'Message Processing', ->
