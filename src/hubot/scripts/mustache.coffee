module.exports = (robot) ->
  robot.hear /(?:mo?u)?sta(?:s|c)he?(?: me)? (.*)/i, (response) ->
    imagery    = response.match[1]
    mustachify = "http://mustachify.me/?src="
    imageUrl   = 'http://ajax.googleapis.com/ajax/services/search/images?' +
                 'v=1.0&rsz=8&q=' +escape(imagery)

    if imagery.match /^https?:\/\//i
      response.send "#{mustachify}#{imagery}"
    else
      response.fetch imageUrl, (res) ->
        images = JSON.parse(res.body)
        images = images.responseData.results
        image  = response.random images

        response.send "#{mustachify}#{image.unescapedUrl}#.png"
