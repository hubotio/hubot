# Description:
#   Shibame is the yet another important thing in your life
#
# Dependencies:
#   None
#
# Configuration:
#   Export your Flickr API key to environmental variable FLICKR_API_KEY
#
# Commands:
#   hubot shiba me - Receive a shiba
#   hubot shiba bomb N - get N shibas

module.exports = (robot) ->
  request = (msg) -> msg.http("https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=#{process.env.FLICKR_API_KEY}&text=shiba+dog&sort=interestingness-desc&extras=url_l&format=json&nojsoncallback=1").get()

  robot.respond /shiba me/i, (msg) ->
    request(msg) (err, res, body) ->
      photos = JSON.parse(body).photos.photo
      msg.send photos[Math.floor(Math.random() * photos.length)].url_l

  robot.respond /shiba bomb( (\d+))?/i, (msg) ->
    count = msg.match[2] || 5
    request(msg) (err, res, body) ->
      photos = JSON.parse(body).photos.photo
      msg.send photos[Math.floor(Math.random() * photos.length)].url_l for [1..count]
