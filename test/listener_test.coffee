chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

Listener = require '../src/listener.coffee'

describe 'Listener', ->
  beforeEach ->
    @robot =
      Response: sinon.spy()

    @matcher = sinon.spy()
    @callback = sinon.spy()

    @message = sinon.spy()

    @listener = new Listener(@robot, @matcher, @callback)

  describe 'constructor', ->
    it 'assigned robot', ->
      expect(@listener.robot).to.equal(@robot)

    it 'assigned matcher', ->
      expect(@listener.matcher).to.equal(@matcher)

    it 'assigned callback', ->
      expect(@listener.callback).to.equal(@callback)

  describe 'when matcher returns false', ->
    beforeEach ->
      @listener.matcher = (message) ->
        false

    it "doesn't call callback", ->
      @listener.call(@message)
      expect(@listener.callback).to.not.have.been.called

    it 'returns false', ->
      expect(@listener.call(@message)).to.be.false

    it "doesn't build a response", ->
      @listener.call(@message)
      expect(@listener.robot.Response).to.not.have.been.called

  describe 'when matcher returns true', ->
    beforeEach ->
      @listener.matcher = (message) ->
        true

    it "calls the callback", ->
      @listener.call(@message)
      expect(@listener.callback).to.been.called

    it 'returns true', ->
      expect(@listener.call(@message)).to.be.true

    it "builds a response", ->
      @listener.call(@message)

      # FIXME more specific testing
      expect(@listener.robot.Response).to.have.been.called
