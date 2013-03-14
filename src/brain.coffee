{EventEmitter} = require 'events'

User = require './user'

class Brain extends EventEmitter
  constructor: ->
    @data = users: { }
    @resetSaveInterval 5

  save: ->
    @emit 'save', @data

  close: ->
    clearInterval @saveInterval
    @save()
    @emit 'close'

  resetSaveInterval: (seconds) ->
    clearInterval @saveInterval if @saveInterval
    @saveInterval = setInterval =>
      @save()
    , seconds * 1000

  mergeData: (data) ->
    for k of (data or { })
      @data[k] = data[k]

    @emit 'loaded', @data

  users: ->
    @data.users

  userForId: (id, options) ->
    user = @data.users[id]
    unless user
      user = new User id, options
      @data.users[id] = user

    if options and options.room and (!user.room or user.room isnt options.room)
      user = new User id, options
      @data.users[id] = user

    user

  userForName: (name) ->
    result = null
    lowerName = name.toLowerCase()
    for k of (@data.users or { })
      userName = @data.users[k]['name']
      if userName? and userName.toLowerCase() is lowerName
        result = @data.users[k]
    result

  usersForRawFuzzyName: (fuzzyName) ->
    lowerFuzzyName = fuzzyName.toLowerCase()
    user for key, user of (@data.users or {}) when (
      user.name.toLowerCase().lastIndexOf(lowerFuzzyName, 0) is 0
    )

  usersForFuzzyName: (fuzzyName) ->
    matchedUsers = @usersForRawFuzzyName(fuzzyName)
    lowerFuzzyName = fuzzyName.toLowerCase()
    for user in matchedUsers
      return [user] if user.name.toLowerCase() is lowerFuzzyName

    matchedUsers

module.exports = Brain
