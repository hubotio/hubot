Robot = require '../robot'
Adapter = require '../adapter'
Message = require '../message'

class Test extends Adapter

exports.use = (robot) ->
  new Test robot
