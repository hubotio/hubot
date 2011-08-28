# A way to interact with the Google Images API.
#
# image me <query>   - The Original™. Queries Google Images for <query> and
#                      returns a random top result.
# animate me <query> - The same thing as `image me`, except adds a few
#                      parameters to try to return an animated GIF instead.
module.exports = (robot) ->
  robot.hear /(image|img)( me)? (.*)/i, (response) ->
    imageMe response.match[3]

  robot.hear /animate me (.*)/i, (response) ->
    imageMe "animated #{response.match[1]}"

imageMe = (res, query) ->
  res.http('http://ajax.googleapis.com/ajax/services/search/images')
    .query(v: "1.0", rsz: '8', q: imagery)
    .get() (err, res, body) ->
      images = JSON.parse(body)
      images = images.responseData.results
      image  = res.random images

      res.send image.unescapedUrl + "#.png"

