# Description
#   Trys to crash Hubot on purpose
#
# Commands:
#   hubot boom [other text]- try to crash Hubot
#   hubot boom emit with msg - try to crash Hubot by emitting an error with a msg
#   hubot boom emit without msg - try to crash Hubot by emitting an error without a msg

boomError = (boom, string) ->
  new Error "Trying to #{boom} because you told me to #{string}"

module.exports = (robot) ->
  robot.respond /(boo+m)(?: (emit with(?:out)? msg|timeout|throw))?/i, (msg) ->
    boom = msg.match[1]
    how = msg.match[2]
    err = boomError(boom, how)

    switch msg.match[1]
      when 'emit with msg'
        robot.emit 'error', boomError(boom, how), msg
      when 'emit without msg'
        robot.emit 'error', boomError(boom, how)
      when 'timeout'
        setTimeout (->
          throw boomError(boom, how)
        ), 0
      else
        throw boomError(boom, how)
