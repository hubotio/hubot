{expect} = require 'chai'
Options = require '../src/options.coffee'

describe "Options", ->

  describe "defaults", ->

    beforeEach ->
      @options = new Options()

    it 'uses the shell adapter', ->
      expect(@options.adapter).to.equal('shell')

    it 'does not set an alias', ->
      expect(@options.alias).to.be.false

    it 'does not create', ->
      expect(@options.create).to.be.false

    it 'enables http', ->
      expect(@options.enableHttpd).to.be.true

    it 'does not load extra scripts', ->
      expect(@options.scripts).to.be.empty

    it 'is named Hubot', ->
      expect(@options.name).to.equal('Hubot')

    it 'has path in current directory', ->
      expect(@options.path).to.equal('.')

    it 'does not show help', ->
      expect(@options.help).to.be.false

  describe 'parsing argv', ->
    it 'can set adapter', ->
      options = new Options(['--adapter', 'campfire'])
      expect(options.adapter).to.equal('campfire')

    describe 'create', ->
      it 'can set create default into current path', ->
        options = new Options(['--create'])
        expect(options.create).to.be.true
        expect(options.path).to.equal('.')

      it 'can set create into a different path', ->
        options = new Options(['--create', '/tmp'])
        expect(options.create).to.be.true
        expect(options.path).to.equal('/tmp')

    it 'can disable httpd', ->
      options = new Options(['--disable-httpd'])
      expect(options.enableHttpd).to.be.false

    it 'can set help', ->
      options = new Options(['--help'])
      expect(options.help).to.exist

    describe 'alias', ->
      it 'can set alias, default to /', ->
        options = new Options(['--alias'])
        expect(options.alias).to.equal('/')
      it 'can set a custom alias', ->
        options = new Options(['--alias', '%'])
        expect(options.alias).to.equal('%')

    it 'can set name', ->
      options = new Options(['--name', 'nubot'])
      expect(options.name).to.equal('nubot')

    # this option doesn't seem to be used
    it 'can require extra scripts'

    it 'can show version', ->
      options = new Options(['--version'])
      expect(options.version).to.be.true
