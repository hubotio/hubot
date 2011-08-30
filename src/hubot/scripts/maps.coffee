# Interacts with the Google Maps API.
#
# map me <query> - Returns a map view of the area returned by `query`.
module.exports = (robot) ->
  robot.hear /(?:(satellite|terrain|hybrid)[- ])?map me (.+)/i, (msg) ->
    mapType  = msg.match[1] || "roadmap"
    location = msg.match[2]
    url      = "http://maps.google.com/maps/api/staticmap?markers=" +
               escape(location) +
               "&size=400x400&maptype=" +
               mapType +
               "&sensor=false" +
               "&format=png" # So campfire knows it's an image

    msg.send url

