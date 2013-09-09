chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

Robot = require '../src/robot.coffee'
Path = require 'path'

describe 'Robot', ->

  beforeEach ->
    @options =
      adapter: 'test'
      adapterPath: Path.join __dirname, "..", "src", "adapters"
    @robot = new Robot(@options)

  describe 'name', ->
    it 'has default name Hubot', ->
      expect(@robot.name).to.equal('Hubot')

    it 'can customize name', ->
      @options.name = 'Tobuh'
      @robot = new Robot(@options)

      expect(@robot.name).to.equal('Tobuh')

  describe 'alias', ->

    it 'has no default', ->
      expect(@robot.alias).to.not.exist

    it 'can be set', ->
      @options.alias = '/'
      @robot = new Robot(@options)
      expect(@robot.alias).to.equal('/')

  it 'works', ->
