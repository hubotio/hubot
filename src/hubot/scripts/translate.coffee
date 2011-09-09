# Allows Hubot to know many languages.
#
# translate me <phrase> - Searches for a translation for the <phrase> and then
#                         prints that bad boy out.
module.exports = (robot) ->
  robot.respond /(translate)( me)? (.*)/i, (msg) ->
    term   = "\"#{msg.match[3]}\""

    msg.http("http://translate.google.com/translate_a/t")
      .query({
        client: 't'
        hl: 'en'
        multires: 1
        sc: 1
        sl: 'auto'
        ssel: 0
        tl: 'en'
        tsel: 0
        uptl: "en"
        text: term
      })
      .get() (err, res, body) ->
        data   = body
        if data.length > 4 && data[0] == '['
          parsed = eval(data)
          parsed = parsed[0] && parsed[0][0] && parsed[0][0][0]
          if parsed
            msg.send "#{term} means #{parsed}"

