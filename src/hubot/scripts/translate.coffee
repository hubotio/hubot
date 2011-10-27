# Allows Hubot to know many languages.
#
# translate me <phrase> - Searches for a translation for the <phrase> and then
#                         prints that bad boy out.
languages =
  "af":"Afrikaans",
  "sq":"Albanian",
  "ar":"Arabic",
  "be":"Belarusian",
  "bg":"Bulgarian",
  "ca":"Catalan",
  "zh-CN":"Simplified Chinese",
  "zh-TW":"Traditional Chinese",
  "hr":"Croatian",
  "cs":"Czech",
  "da":"Danish",
  "nl":"Dutch",
  "en":"English",
  "et":"Estonian",
  "tl":"Filipino",
  "fi":"Finnish",
  "fr":"French",
  "gl":"Galician",
  "de":"German",
  "el":"Greek",
  "iw":"Hebrew",
  "hi":"Hindi",
  "hu":"Hungarian",
  "is":"Icelandic",
  "id":"Indonesian",
  "ga":"Irish",
  "it":"Italian",
  "ja":"Japanese",
  "ko":"Korean",
  "lv":"Latvian",
  "lt":"Lithuanian",
  "mk":"Macedonian",
  "ms":"Malay",
  "mt":"Maltese",
  "no":"Norwegian",
  "fa":"Persian",
  "pl":"Polish",
  "pt":"Portuguese",
  "ro":"Romanian",
  "ru":"Russian",
  "sr":"Serbian",
  "sk":"Slovak",
  "sl":"Slovenian",
  "es":"Spanish",
  "sw":"Swahili",
  "sv":"Swedish",
  "th":"Thai",
  "tr":"Turkish",
  "uk":"Ukranian",
  "vi":"Vietnamese",
  "cy":"Welsh",
  "yi":"Yiddish"

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
          language = languages[parsed[2]]
          parsed = parsed[0] && parsed[0][0] && parsed[0][0][0]
          if parsed
            msg.send "#{term} means #{parsed} in #{language}"

