module.exports = (robot) ->

  robot.respond
    description: 'Searches YouTube for the <query> and returns the video link'
    example: 'hubot youtube me <query>'
    match: /(youtube|yt)( me)? (.*)/i
    handler: (msg, user, room, matches) ->
      query = matches[3]
      robot.http("http://gdata.youtube.com/feeds/api/videos")
        .query({
          'orderBy': "relevance"
          'max-results': 15
          'alt': 'json'
          'q': query
        })
        .get() (err, res, body) ->
          videos = JSON.parse(body)
          videos = videos.feed.entry
          video  = robot.random videos

          for link in video.link
            if link.rel is "alternate" and link.type is "text/html"
              room.send link.href
