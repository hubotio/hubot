# Scripting

Hubot out of the box doesn't do too much, but it is an extensible, scriptable robot friend.

## Anantomy of a script

When you created your hubot, the generator also creates a `scripts` directory. If you peak around there, you can see some examples of scripts. For a script to be a script, it needs to:

* live in a directory on the hubot script load path (`src/scripts` and `scripts` by default)
* be a `.coffee` or `.js` file
* export a function

By export a function, we just mean: 

```coffeescript
module.exports = (robot) ->
  # your code here
```

The `robot` parameter is an instance of your robot friend. At this point, we can start scripting up some awesomeness.


## Hear & respond

Since this is a chat bot, the most common interactions are based on messages. Hubot can `hear` messages said in a room or `respond` to messages directly addressed at it. Both methods take a regular expression and a callback function as parameters. For example:


```coffeescript
module.exports = (robot) ->
  robot.hear /badger/i, (msg) ->
    # your code here

  robot.respond /open the pod bay doors/i, (msg) ->
    # your code here
```

The `robot.hear /badgers/`'s callback is called for messages containing text like "Stop badgering the witness", or "badger me", or "what exactly is a badger anyways"? As long as the message's text matches, the callback is called.

The `robot.respond /open the pod bay doors/i` callback is only called for messages that are immediately preceeded by the robot's name or alias. If the robot's name is HAL and alias is /, then this callback would be triggered for "hal open the pod bay doors", "HAL: open the pod bay doors", "@HAL open the pod bay doors", "/open the pod bay doors". It wouldn't be called for "HAL: please open the pod bay doors" (because it's `respond` is bound to the text immediately following the robot name) or "has anyone ever mentioned how lovely you are when you open pod bay doors?" (because it lacks the robot's name).

## Send & reply

The `msg` parameter is, despite the name, an instance of [Message](../src/response.coffee). With it, you can `send` a message back to the room the `msg` came from, or `reply` to the person that sent the message. For example:

```coffeescript
module.exports = (robot) ->
  robot.hear /badger/i, (msg) ->
    msg.send "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS"

  robot.respond /open the pod bay doors/i, (msg) ->
    msg.reply "I'm afraid I can't let you do that."
```

`robot.hear /badgers/`'s callback sends a message exactly as specified regardless of who said it, "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS". 

If a user Dave says "HAL: open the pod bay doors", `robot.respond /open the pod bay doors/i` callback sends a message "Dave: I'm afraid I can't let you do that."

## Capturing data

So far, our scripts have had static responses, which while amusing, are boring functionality-wise. `msg.match` has the result of `match`ing the incoming message against the regular expression. This is just a [javascript thing](http://www.w3schools.com/jsref/jsref_match.asp), which ends up being an array with index 0 being the full text matching the expression. If you include capture groups, those will be populated in the other indexes. For example, if we update a script like:


```coffeescript
  robot.respond /open the (.*) doors/i, (msg) ->
    # your code here
```

If Dave says "HAL: open the pod bay doors", then `msg.match[0]` is "open the pod bay doors", and `msg.match[1]` is just "pod bay" doors. Now we can start doing more dynamic things:

```coffeescript
  robot.respond /open the (.*) doors/i, (msg) ->
    doorType = msg.match[1]
    if doorType is "pod bay"
      msg.reply "I'm afraid I can't let you do that."
    else
      msg.reply "Opening #{doorType} doors"
```

## Making HTTP calls

Hubot can make HTTP calls on your behalf to integrate & consume third party APIs. This can be through an instance of [node-scoped-http-client](https://github.com/technoweenie/node-scoped-http-client) available at `robot.http`. The simplest case looks like:


```coffeescript
  robot.http("https://midnight-train")
    .get() (err, res, body) ->
      # your code here
```

`err` is any errors encountered on the way. You'll generally want to check for this and handle accordingly:

```coffeescript
  robot.http("https://midnight-train")
    .get() (err, res, body) ->
      if err
        msg.send "Encountered an error :( #{err}
        return
      # your code here, knowing it was successful
```

`res` is an instance of node's [http.ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse). Most of the methods don't matter as much when using node-scoped-http-client, but of interest are `statusCode` and `getHeader`. Use `statusCode` to check for the HTTP status code, where usually non-200 means something bad happened. Use `getHeader` for peaking at the header, for example to check for rate limiting:

```coffeescript
  robot.http("https://midnight-train")
    .get() (err, res, body) ->
      # pretend there's error checking code here

      if res.statusCode isnt 200
        msg.send "Request didn't come back HTTP 200 :("
        return

      rateLimitRemaining = parseInt res.getHeader('X-RateLimit-Limit') if res.getHeader('X-RateLimit-Limit')
      if rateLimitRemaining and rateLimitRemaining < 1
        msg.send "Rate Limit hit, stop believing for awhile"

      # rest of your code
```

`body` is the response's body as a string, the thing you probably care about the most:

```coffeescript
  robot.http("https://midnight-train")
    .get() (err, res, body) ->
      # error checking code here

      msg.send "Got back #{body}"
```

### JSON

If you are talking to APIs, the easiest way is going to be JSON because it doesn't require any extra dependencies. When making the `robot.http` call, you should usually set the  `Accept` header to give the API a clue that's what you are expecting back. Once you get the `body` back, you can parse it with `JSON.parse`:


```coffeescript
  robot.http("https://midnight-train")
    .header('Accept', 'application/json')
    .get() (err, res, body) ->
      # error checking code here

      data = JSON.parse(body)
      msg.send "#{data.passenger} taking midnight train going #{data.destination}"
```

It's possible to get non-JSON back, like if the API hit an error and it tries to render a normal HTML error instead of JSON. To be on the safe side, you should check the `Content-Type`, and catch any errors while parsing.

```coffeescript
  robot.http("https://midnight-train")
    .header('Accept', 'application/json')
    .get() (err, res, body) ->
      # err & response status checking code here

      if response.getHeader('Content-Type') isnt 'application/json'
        msg.send "Didn't get back JSON :("
        return

      data = null
      try
        data = JSON.parse(body)
      catch error
       msg.send "Ran into an error parsing JSON :("
       return

      # your code here
```

### XML

XML APIs are harder because there's not a bundled XML parsing library. It's beyond the scope of this documentation to go into detail, but here's a few libraries to check out:

* [xml2json](https://github.com/buglabs/node-xml2json) (simplest to use, but has some limitations)
* [jsdom](https://github.com/tmpvar/jsdom) (JavaScript implementation of the W3C DOM)
* [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)

### Screen scraping

For those times that there isn't an API, there's always the possibility of screen-scraping. It's beyond the scope of this documentation to go into detail, but here's a few libraries to check out:

* [cheerio](https://github.com/MatthewMueller/cheerio) (familiar syntax and API to jQuery)
* [jsdom](https://github.com/tmpvar/jsdom) (JavaScript implementation of the W3C DOM)

## TODO

* [ ] enter & leave
* [ ] topic
* [ ] catch all
* [ ] environment variables and configuration
* [ ] dependencies
* [ ] http client
* [ ] interval and timeout
* [ ] http end points
* [ ] events
