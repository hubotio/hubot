# Allows Hubot to know many languages.
#
# translate me <phrase> - Searches for a translation for the <phrase> and then
#                         prints that bad boy out.
module.exports = (robot) ->
  robot.hear /(translate)( me)? (.*)/i, (response) ->
    term   = "\"#{response.match[3]}\""
    params = "client=t&hl=en&multires=1&sc=1&sl=auto&ssel=0&tl=en&tsel=0&uptl=en"

    url    = "http://translate.google.com/translate_a/t?#{params}&text=#{encodeURI(term)}"

    response.fetch url, (res) ->
      data   = res.body
      if data.length > 4 && data[0] == '['
        parsed = eval(data)
        parsed = parsed[0] && parsed[0][0] && parsed[0][0][0]
        if parsed
          response.send "#{term} means #{parsed}"

