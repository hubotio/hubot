module.exports = (robot) ->

  robot.respond
    description: 'Receive a pug'
    example: 'hubot pug me'
    match: /pug me/i
    handler: (msg, user, room, matches) ->
      robot.http("http://pugme.herokuapp.com/random")
        .get() (err, res, body) ->
          room.send JSON.parse(body).pug

  robot.respond
    description: 'Receive <amount> pugs'
    example: 'hubot pug bomb <amount>'
    match: /pug bomb( (\d+))?/i
    handler: (msg, user, room, matches) ->
      count = matches[2] || 5
      robot.http("http://pugme.herokuapp.com/bomb?count=#{count}")
        .get() (err, res, body) ->
          room.send pug for pug in JSON.parse(body).pugs

  robot.respond
    description: 'Get how many pugs are available'
    example: 'hubot how many pugs are there'
    match: /how many pugs are there/i
    handler: (msg, user, room, matches) ->
      robot.http("http://pugme.herokuapp.com/count")
        .get() (err, res, body) ->
          room.send "There are #{JSON.parse(body).pug_count} pugs."
