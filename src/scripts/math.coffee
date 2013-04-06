module.exports = (robot) ->

  robot.respond
    description: [
      'Calculate the given expression'
      'Convert the given expression to units'
    ]
    example: [
      'hubot math me <expr>'
      'hubot convert me <expr> to <unit>'
    ]
    match: /(calc|calculate|convert|math)( me)? (.*)/i
    handler: (msg, room, user, matches) ->
      robot
        .http('https://www.google.com/ig/calculator')
        .query
          hl: 'en'
          q: matches[3]
        .headers
          'Accept-Language': 'en-us,en;q=0.5',
          'Accept-Charset': 'utf-8',
          'User-Agent': "Mozilla/5.0 (X11; Linux x86_64; rv:2.0.1) Gecko/20100101 Firefox/4.0.1"
        .get() (err, res, body) ->
          json = eval("(#{body})")
          room.send json.rhs or 'Could not compute.'
