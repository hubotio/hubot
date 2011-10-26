Robot = require('robot')
Redis = require 'redis'
Url   = require 'url'

class RedisBrain extends Robot.Brain
  # Represents somewhat persistent storage for the robot.
  #
  # Returns a new Brain that's trying to connect to redis
  #
  # Previously persisted data is loaded on a successful connection
  #
  # Redis connects to a environmental variable REDISTOGO_URL or
  # fallsback to localhost
  constructor: () ->
    super()

    info = Url.parse process.env.REDISTOGO_URL || 'redis://localhost:6379'
    @client = Redis.createClient(info.port, info.hostname)

    if info.auth
      @client.auth info.auth.split(":")[1]

    @client.on "error", (err) ->
      console.log "Error #{err}"
    @client.on "connect", =>
      console.log "Successfully connected to Redis"
      @client.get "hubot:storage", (err, reply) =>
        throw err if err
        if reply
          @mergeData JSON.parse reply.toString()

      @saveInterval = setInterval =>
        @save()
      , 5000

  save: (cb) ->
    data = JSON.stringify @data
    cb or= (err, reply) ->
    @client.set "hubot:storage", data, cb

  close: ->
    clearInterval @saveInterval
    @save => @client.quit()

exports.RedisBrain = RedisBrain
