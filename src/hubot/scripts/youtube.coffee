module.exports = (robot) ->
  robot.hear /(youtube|yt)( me)? (.*)/i, (response) ->
    query = response.match[3]
    url   = "http://gdata.youtube.com/feeds/api/videos?" +
            "orderBy=relevance&max-results=15&alt=json&q=" +
            escape(query)

    response.fetch url, (res) ->
      videos = JSON.parse(res.body)
      videos = videos.feed.entry
      video  = response.random videos

      video.link.forEach (link) ->
        if link.rel == "alternate" && link.type == "text/html"
          response.send link.href
