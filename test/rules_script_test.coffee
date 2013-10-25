chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

Robot = require '../src/robot'
Path = require 'path'
Message = require '../src/message'

describe 'rules.coffee', ->

  beforeEach ->
    @options =
      adapter: 'test'
      adapterPath: Path.join __dirname, "..", "src", "adapters"
    @robot = new Robot(@options)

    @robot.scripts.loadFile '../src/scripts/rules.coffee'

    @robot.run()

  it "should have a listener", ->
    expect(@robot.listeners.length).to.equal(1)

  describe "receiving 'hubot rules'", ->
    beforeEach ->
      @robot.adapter.receive new Message 'text', user: 'Shell', text: 'Hubot rules'

    it "sends one message", ->
      expect(@robot.adapter.sent.length).to.equal(1)
