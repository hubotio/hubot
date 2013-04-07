rules = [
  "1. A robot may not injure a human being or, through inaction, allow a human being to come to harm.",
  "2. A robot must obey any orders given to it by human beings, except where such orders would conflict with the First Law.",
  "3. A robot must protect its own existence as long as such protection does not conflict with the First or Second Law."
  ]

otherRules = [
  "A developer may not injure Apple or, through inaction, allow Apple to come to harm.",
  "A developer must obey any orders given to it by Apple, except where such orders would conflict with the First Law.",
  "A developer must protect its own existence as long as such protection does not conflict with the First or Second Law."
  ]

module.exports = (robot) ->

  robot.respond
    description: 'Make sure hubot still knows the rules'
    example: 'hubot what are the rules'
    match: /(what are )?the (three |3 )?(rules|laws)/i
    handler: (msg, user, room, matches) ->
      text = msg.text
      if text.match(/apple/i) or text.match(/dev/i)
        room.send otherRules.join('\n')
      else
        room.send rules.join('\n')
