Robot        = require "../robot"
HTTPS        = require "https"
EventEmitter = require("events").EventEmitter
oauth       = require('oauth');

key = process.env.HUBOT_TWITTER_KEY
secret=process.env.HUBOT_TWITTER_SECRET
token=process.env.HUBOT_TWITTER_TOKEN
tokensecret=process.env.HUBOT_TWITTER_TOKEN_SECRET

consumer = new oauth.OAuth("https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",key, secret, "1.0", "", "HMAC-SHA1");


class Twitter extends Robot
  send: (user, strings...) ->
    strings.forEach (str) =>
        text= str
        console.log text
        tweetsText = str.split('\n')
        tweetsText.forEach (tweetText) =>
            console.log "send twitt to #{user} with text #{tweetText}"
            consumer.post "https://api.twitter.com/1/statuses/update.json", token,tokensecret,{status:'@'+user+' '+tweetText},'UTF-8',  (error, data, response) ->
              if error
               console.log "twitter send error: #{error} #{data}"
              console.log "Status #{response.statusCode}"


  reply: (user, strings...) ->
    strings.forEach (str) =>
        text= str
        console.log "send pm to #{user} with text #{text}"
        consumer.post "https://api.twitter.com/1/direct_messages/new.json", token,tokensecret,{text:text,user:user},'UTF-8',  (error, data, response) ->
        if error
         console.log "twitter send error: #{error} #{data}"
        console.log "Status #{response.statusCode}"

  run: ->
    self = @
    bot = new TwitterStreaming()

    bot.Tweet self.name, (err, data) ->
        reg = new RegExp('@'+self.name,'i')
        console.log "received #{data.text} from #{data.user.screen_name}"
        self.receive new Robot.TextMessage data.user.screen_name,data.text.replace reg, self.name
        if err
          console.log "received error: #{err}"

    @bot = bot

module.exports = Twitter

class TwitterStreaming extends EventEmitter
  self=@
  constructor: () ->
    @domain        = 'stream.twitter.com'

  Tweet: (track,callback) ->
    @post "/1/statuses/filter.json?track="+track,'', callback


  # Convenience HTTP Methods for posting on behalf of the token"d user
  get: (path, callback) ->
    @request "GET", path, null, callback

  post: (path, body, callback) ->
    @request "POST", path, body, callback

  request: (method, path, body, callback) ->
    console.log @domain
    request = consumer.get 'https://'+@domain+path, token,tokensecret, null
    request.on "response",(response)->
          response.on "data", (chunk) ->
             parseResponse chunk+'',callback
          response.on "end", (data) ->
             console.log 'end request'
          response.on "error", (data) ->
             console.log 'error '+data
    request.end();


    parseResponse = (data,callback) ->
      while ((index = data.indexOf('\r\n')) > -1)
           json = data.slice(0, index);
           data = data.slice(index + 2);
           if(json.length > 0)
             try
                console.log "json"+json
                callback null, JSON.parse(json)
             catch err
                console.log "error parse"+json
                callback null, data || { }

