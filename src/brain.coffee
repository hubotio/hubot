EventEmitter = require('events').EventEmitter

# http://www.the-isb.com/images/Nextwave-Aaron01.jpg
class Brain extends EventEmitter
  # Represents somewhat persistent storage for the robot.
  #
  # Returns a new Brain with no external storage.  Extend this!
  constructor: () ->
    @data =
      users: { }

    @resetSaveInterval 5

  # Emits the 'save' event so that 'brain' scripts can handle persisting.
  #
  # Returns nothing.
  save: ->
    @emit 'save', @data

  # Emits the 'close' event so that 'brain' scripts can handle closing.
  #
  # Returns nothing.
  close: ->
    clearInterval @saveInterval
    @save()
    @emit 'close'

  # Reset the interval between save function calls.
  #
  # seconds - An Integer of seconds between saves.
  #
  # Returns nothing.
  resetSaveInterval: (seconds) ->
    clearInterval @saveInterval if @saveInterval
    @saveInterval = setInterval =>
      @save()
    , seconds * 1000

  # Merge keys loaded from a DB against the in memory representation
  #
  # Returns nothing
  #
  # Caveats: Deeply nested structures don't merge well
  mergeData: (data) ->
    for k of (data or { })
      @data[k] = data[k]

    @emit 'loaded', @data

module.exports = Brain

