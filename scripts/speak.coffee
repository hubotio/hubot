# Allows Hubot to speak many languages.
#
# speak me <phrase> - Detects the language 'phrase' is written in, then
#                     sends back a spoken version of that phrase in its native
#                     language. 

module.exports = (robot) ->
  robot.hear /(speak)( me)? (.*)/i, (msg) ->
    term   = "\"#{msg.match[3]}\""
    apiKey = process.env.HUBOT_MSTRANSLATE_APIKEY
    langs = ["en"]

    getLanguagesForSpeak = "http://api.microsofttranslator.com/V2/Ajax.svc/GetLanguagesForSpeak"
    detect = "http://api.microsofttranslator.com/V2/Ajax.svc/Detect"
    speak = "http://api.microsofttranslator.com/V2/Ajax.svc/Speak"

    unless apiKey
      msg.send "MS Translate API key isn't set, get a key at http://www.bing.com/developers/appids.aspx"
      msg.send "Then, set the HUBOT_MSTRANSLATE_APIKEY environment variable"
      return

    msg.http(getLanguagesForSpeak)
      .query({ appId: apiKey })
      .get() (err, res, body) ->
        langs = eval(body) unless err

        msg.http(detect)
          .query({appId: apiKey, text: term})
          .get() (err, res, body) ->
            if err or (langs.indexOf(eval(body)) == -1)
              msg.send "Sorry, I can't speak #{err or eval(body)}"
              return
            lang = eval(body)

            msg.http(speak)
              .query({ appId: apiKey, text: term, language: lang, format: "audio/wav" })
              .get() (err, res, body) ->
                msg.send(eval(body)) unless err
