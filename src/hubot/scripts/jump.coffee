# Makes humbot jump.
#
# jump - Make humbot jump.


jump = (msg, counter) ->
  height = (msg.match[1] ? '').trim()
  if height
    msg.send "#{msg.robot.name} is jumping #{height}"
    return

  switch counter
    when 3 then msg.reply "Are you mad at me? Why don't you talk to me? How height must I jump?"
    when 4 then msg.reply "Ok, I give up! :'("; return
    else        msg.reply "How height?"

  msg.waitResponse (msg) -> jump(msg, counter + 1)


module.exports = (robot) ->
  robot.respond /jump( .*)?\s*$/i, (msg) ->
    jump(msg, 0)
