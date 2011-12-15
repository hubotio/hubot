# A way to interact with the Google Images API.
#
# image me <query>    - The Original. Queries Google Images for <query> and
#                       returns a random top result.
# animate me <query>  - The same thing as `image me`, except adds a few
#                       parameters to try to return an animated GIF instead.
# mustache me <url>   - Adds a mustache to the specified URL.
# mustache me <query> - Searches Google Images for the specified query and
#                       mustaches it.
module.exports = (robot) ->
  robot.respond /(image|img)( me)? (.*)/i, (msg) ->
    imageMe msg, msg.match[3], (url) ->
      msg.send url

  robot.respond /animate me (.*)/i, (msg) ->
    imageMe msg, "animated #{msg.match[1]}", (url) ->
      msg.send url

  robot.respond /(?:mo?u)?sta(?:s|c)he?(?: me)? (.*)/i, (msg) ->
    type = Math.floor(Math.random() * 3)
    mustachify = "http://mustachify.me/#{type}?src="
    imagery = msg.match[1]

    if imagery.match /^https?:\/\//i
      msg.send "#{mustachify}#{imagery}"
    else
      imageMe msg, imagery, (url) ->
        msg.send "#{mustachify}#{url}"

imageMe = (msg, query, cb) ->
  msg.http('http://ajax.googleapis.com/ajax/services/search/images')
    .query(v: "1.0", rsz: '8', q: query)
    .get() (err, res, body) ->
      images = JSON.parse(body)
      images = images.responseData.results
      if images.length > 0
        image  = msg.random images
        cb "#{image.unescapedUrl}#.png"

