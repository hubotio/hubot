chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

Adapter = require '../src/adapter.coffee'

describe 'Adapter', ->
  beforeEach ->
    @robot =
      receive: sinon.spy()

  # this one is hard, as it requires files
  it "can load adapter by name"

  describe 'Public API', ->
    beforeEach ->
      @adapter = new Adapter(@robot)

    it 'assigns robot', ->
      expect(@adapter.robot).to.equal(@robot)

    describe 'send', ->
      it 'is a function', ->
        expect(@adapter.send).to.be.a('function')

      it 'does nothing', ->
        @adapter.send({}, 'nothing')

    describe 'reply', ->
      it 'is a function', ->
        expect(@adapter.reply).to.be.a('function')

      it 'does nothing', ->
        @adapter.reply({}, 'nothing')

    describe 'topic', ->
      it 'is a function', ->
        expect(@adapter.topic).to.be.a('function')

      it 'does nothing', ->
        @adapter.topic({}, 'nothing')

    describe 'topic', ->
      it 'is a function', ->
        expect(@adapter.topic).to.be.a('function')

      it 'does nothing', ->
        @adapter.topic({}, 'nothing')

    describe 'play', ->
      it 'is a function', ->
        expect(@adapter.play).to.be.a('function')

      it 'does nothing', ->
        @adapter.play({}, 'nothing')

    describe 'run', ->
      it 'is a function', ->
        expect(@adapter.run).to.be.a('function')

      it 'does nothing', ->
        @adapter.run()

    describe 'close', ->
      it 'is a function', ->
        expect(@adapter.close).to.be.a('function')

      it 'does nothing', ->
        @adapter.close()


  it 'dispatches received messages to the robot', ->
    @robot.receive = sinon.spy()
    @adapter = new Adapter(@robot)
    @message = sinon.spy()
    
    @adapter.receive(@message)

    expect(@robot.receive).to.have.been.calledWith(@message)
