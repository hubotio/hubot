chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

Response = require '../src/response.coffee'

describe 'Response', ->
  beforeEach ->
    @adapter =
      send: sinon.spy()
      reply: sinon.spy()
      topic: sinon.spy()
      play: sinon.spy()
      locked: sinon.spy()

    @robot =
      adapter: @adapter
      http: sinon.spy()

    @message =
      finish: sinon.spy()
      room: 123
      user: "thisguy"


    @envelope =
      message: @message
      room: @message.room
      user: @message.user

    @match = "thisguy".match(/guy/)

    @response = new Response(@robot, @message, @match)

  describe 'new', ->
    it 'sets the robot', ->
      expect(@response.robot).to.equal(@robot)

    it 'sets the message', ->
      expect(@response.message).to.equal(@message)

    it 'sets the match', ->
      expect(@response.match).to.equal(@match)

    it 'builds an envelope containing the room, user, and message', ->
      expect(@response.envelope.room).to.equal(123)
      expect(@response.envelope.user).to.equal("thisguy")
      expect(@response.envelope.message).to.equal(@message)


  describe 'send', ->
    it 'calls the adapter', ->
      @response.send('what', 'up')

      expect(@adapter.send).to.have.been.calledWith(@envelope, 'what', 'up')

  describe 'reply', ->
    it 'calls the adapter', ->
      @response.reply('soooo', 'about that...')

      expect(@adapter.reply).to.have.been.calledWith(@envelope, 'soooo', 'about that...')

  describe 'topic', ->
    it 'calls the adapter', ->
      @response.topic('for a limited time only...')

      expect(@adapter.topic).to.have.been.calledWith(@envelope, 'for a limited time only...')

  describe 'play', ->
    it 'calls the adapter', ->
      @response.play('trombone', 'tmyk')

      expect(@adapter.play).to.have.been.calledWith(@envelope, 'trombone', 'tmyk')

  describe 'locked', ->
    it 'calls the adapter', ->
      @response.locked('there is no spoon')

      expect(@adapter.locked).to.have.been.calledWith(@envelope, 'there is no spoon')


  describe 'random', ->
    it 'returns a random element of an array'
      # how do you test random, lol
  
  describe 'finish', ->
    it 'marks the message as finished', ->
      @response.finish()

      expect(@response.message.finish).to.have.been.called

  describe 'http', ->
    it 'calls to the robot', ->
      @response.http('http://youtube.com')

      expect(@robot.http).to.have.been.calledWith('http://youtube.com')
