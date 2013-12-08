# Description:
#   Allows Hubot to do mathematics.
#
# Commands:
#   hubot math me <expression> - Calculate the given expression.
module.exports = (robot) ->
  robot.respond /(calc|calculate|calculator|math|maths)( me)? (.*)/i, (msg) ->
    mathjs = require('mathjs')
    math = mathjs()
    msg.send math.eval(msg.match[3])
