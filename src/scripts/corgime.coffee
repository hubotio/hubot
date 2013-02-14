# Description:
#   Corgime is your one true source for corgis
#
# Commands:
#   hubot corgi me - receive a corgi
#   hubot corgi bomb N - get N corgis

module.exports = (robot) ->

  robot.respond /corgi me/i, (msg) ->
    msg.http("http://corginator.herokuapp.com/random")
      .get() (err, res, body) ->
        msg.send JSON.parse(body).corgi

  robot.respond /corgi bomb( (\d+))?/i, (msg) ->
    count = msg.match[2] || 5
    msg.http("http://corginator.herokuapp.com/bomb?count=" + count)
      .get() (err, res, body) ->
        msg.send corgi for corgi in JSON.parse(body).corgis

  robot.respond /how many corgis are there/i, (msg) ->
    msg.http("http://corginator.herokuapp.com/count")
      .get() (err, res, body) ->
        msg.send "There are #{JSON.parse(body).corgi_count} corgis."

