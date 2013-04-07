module.exports = (robot) ->

  imageMe = (query, animated, faces, cb) ->
    cb = animated if typeof animated == 'function'
    cb = faces if typeof faces == 'function'
    q = v: '1.0', rsz: '8', q: query, safe: 'active'
    q.imgtype = 'animated' if typeof animated is 'boolean' and animated is true
    q.imgtype = 'face' if typeof faces is 'boolean' and faces is true
    robot.http('http://ajax.googleapis.com/ajax/services/search/images')
      .query(q)
      .get() (err, res, body) ->
        images = JSON.parse(body)
        images = images.responseData?.results
        if images?.length > 0
          image  = robot.random images
          cb "#{image.unescapedUrl}#.png"

  robot.respond
    description: 'The Original. Queries Google images for <query> and returns a random top result'
    example: 'hubot image me <query>'
    match: /(image|img)( me)? (.*)/i
    handler: (msg, user, room, matches) ->
      imageMe matches[3], (url) ->
        room.send url

  robot.respond
    description: 'The same thing as `image me` except tries to find an animated gif'
    example: 'hubot animate me <query>'
    match: /animated( me)? (.*)/i
    handler: (msg, user, room, matches) ->
      imageMe matches[2], true, (url) ->
        room.send url

  robot.respond
    description: 'Adds a mustache to the specified URL or search for an image'
    example: 'hubot mustache me <url|query>'
    match: /(?:mo?u)?sta(?:s|c)he?(?: me)? (.*)/i
    handler: (msg, user, room, matches) ->
      type = Math.floor(Math.random() * 3)
      mustachify = "http://mustachify.me/#{type}?src="
      imagery = matches[1]

      if imagery.match /^https?:\/\//i
        room.send "#{mustachify}#{imagery}"
      else
        imageMe imagery, false, true, (url) ->
          room.send "#{mustachify}#{url}"
