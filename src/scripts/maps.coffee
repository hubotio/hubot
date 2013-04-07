module.exports = (robot) ->

  robot.respond
    description: 'Returns a map view of the area returned by <query>'
    example: 'hubot map me <query>'
    match: /(?:(satellite|terrain|hybrid)[- ])?map me (.+)/i
    handler: (msg, room, user, matches) ->
      mapType  = matches[1] or "roadmap"
      location = matches[2]
      mapUrl   = "http://maps.google.com/maps/api/staticmap?markers=" +
                 escape(location) +
                 "&size=400x400&maptype=" +
                 mapType +
                 "&sensor=false" +
                 "&format=png"

      url      = "http://maps.google.com/maps?q=" +
                 escape(location) +
                 "&hl=en&sll=37.0625,-95.677068&sspn=73.579623,100.371094&vpsrc=0&hnear=" +
                 escape(location) +
                 "&t=m&z=11"

      room.send mapUrl
      room.send url
