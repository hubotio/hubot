# A way to interact with the Google Images API.
#
# image me <query>   - The Original™. Queries Google Images for <query> and
#                      returns a random top result.
# animate me <query> - The same thing as `image me`, except adds a few
#                      parameters to try to return an animated GIF instead.
module.exports = (robot) ->
  robot.hear /(image|img)( me)? (.*)/i, (msg) ->
    imageMe msg, msg.match[3]

  robot.hear /animate me (.*)/i, (msg) ->
    imageMe msg, "animated #{msg.match[1]}"

imageMe = (msg, query) ->
  msg.http('http://ajax.googleapis.com/ajax/services/search/images')
    .query(v: "1.0", rsz: '8', q: query)
    .get() (err, res, body) ->
      images = JSON.parse(body)
      images = images.responseData.results
      image  = msg.random images

      msg.send image.unescapedUrl + "#.png"

