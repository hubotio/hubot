# Messing around with the YouTube API.
#
# youtube me <query> - Searches YouTube for the query and returns the video
#                      embed link.
module.exports = (robot) ->
  robot.respond /(youtube|yt)( me)? (.*)/i, (msg) ->
    query = msg.match[3]
    msg.http("http://gdata.youtube.com/feeds/api/videos")
      .query({
        orderBy: "relevance"
        'max-results': 15
        alt: 'json'
        q: query
      })
      .get() (err, res, body) ->
        videos = JSON.parse(body)
        videos = videos.feed.entry
        video  = msg.random videos

        video.link.forEach (link) ->
          if link.rel == "alternate" && link.type == "text/html"
            msg.send link.href
