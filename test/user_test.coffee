{expect} = require 'chai'
User = require '../src/user.coffee'

describe 'User', ->
  describe 'new', ->
    it 'uses id as the default name', ->
      user = new User('hubot')

      expect(user.name).to.equal('hubot')

    it 'sets attributes passed in', ->
      user = new User('hubot', foo: 1, bar: 2)

      expect(user.foo).to.equal(1)
      expect(user.bar).to.equal(2)

    it 'uses name attribute when passed in, not id', ->
      user = new User('hubot', name: 'tobuh')

      expect(user.name).to.equal('tobuh')
