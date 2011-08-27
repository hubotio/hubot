# A way to interact with the Google Images API.
#
# image me <query>   - The Original™. Queries Google Images for <query> and
#                      returns a random top result.
# animate me <query> - The same thing as `image me`, except adds a few
#                      parameters to try to return an animated GIF instead.
module.exports = (robot) ->
  robot.hear /(image|img)( me)? (.*)/i, (response) ->
    imagery = response.match[3]
    imgurl  = 'http://ajax.googleapis.com/ajax/services/search/images?' +
              'v=1.0&rsz=8&q=' +escape(imagery)

    response.fetch imgurl, (res) ->
      images = JSON.parse(res.body)
      images = images.responseData.results
      image  = response.random images

      response.send image.unescapedUrl + "#.png"

  robot.hear /animate me (.*)/i, (response) ->
    imagery = response.match[1]
    imgurl  = 'http://ajax.googleapis.com/ajax/services/search/images?' +
              'v=1.0&rsz=8&as_filetype=gif&q=animted%20' +escape(imagery)

    response.fetch imgurl, (res) ->
      images = JSON.parse(res.body)
      images = images.responseData.results
      image  = response.random images

      response.send image.unescapedUrl + "#.png"
