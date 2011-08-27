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
