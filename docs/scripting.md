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


## Hearing and responding

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

## Random

A common pattern is to hear or respond to commands, and send with a random funny image or line of text from an array of possibilities. It's annoying to do this in javascript and coffeescript out of the box, so Hubot includes a convenience method:

```coffeescript
lulz = ['lol', 'rofl', 'lmao']

msg.send msg.random lulz
```

## Topic

Hubot can react to a room's topic changing, assuming that the adapter supports it.

```coffeescript
module.exports = (robot) ->
  robot.topic (msg) ->
    msg.send "#{msg.message.text}? That's a Paddlin'"
```

## Entering and leaving

Hubot can to user's entering and leaving, assuming that the adapter supports it.

```coffeescript
enterReplies = ['Hi', 'Target Acquired', 'Firing', 'Hello friend.', 'Gotcha', 'I see you']
leaveReplies = ['Are you still there?', 'Target lost', 'Searching']

module.exports = (robot) ->
  robot.enter (msg) ->
    msg.send msg.random enterReplies
  robot.leave (msg) ->
    msg.send msg.random leaveReplies
```

## Environment variables

Hubot can access the environment he's running in, just like any other node program, using [`process.env`](http://nodejs.org/api/process.html#process_process_env). This can be used to configure how scripts are run, with the convention being to use the `HUBOT_` prefix.

```coffeescript
answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING

module.exports = (robot) ->
  robot.respond /what is the answer to the ultimate question of life/, (msg)
    msg.send "#{answer}, but what is the question?"
```

Care should be taken to make sure the script can load if it's not defined,  give the Hubot developer notes on how to define it, or default to something . It's up to the script writer to decide if that should be a fatal error (ie hubot exits), or not (make any script that relies on it to say it needs to be configured. When possible and when it makes sense to, having a script work without any other configuration is preferred.

Here we can default to something:

```coffeescript
answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING or 42

module.exports = (robot) ->
  robot.respond /what is the answer to the ultimate question of life/, (msg)
    msg.send "#{answer}, but what is the question?"
```

Here we exit if it's not defined:

```coffeescript
answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING
unless answer?
  console.log "Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again"
  process.exit(1)

module.exports = (robot) ->
  robot.respond /what is the answer to the ultimate question of life/, (msg)
    msg.send "#{answer}, but what is the question?"
```

And lastly, we update the `robot.respond` to check it:

```coffeescript
answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING

module.exports = (robot) ->
  robot.respond /what is the answer to the ultimate question of life/, (msg)
    unless answer?
      msg.send "Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again"
      return
    msg.send "#{answer}, but what is the question?"
```

## Dependencies

Hubot uses [npm](https://github.com/isaacs/npm) to manage it's dependencies. To additional packages, add them to `dependencies` in `package.json`. For example, to add lolimadeupthispackage 1.2.3, it'd look like:

```json
  "dependencies": {
    "hubot":         "2.5.5",
    "hubot-scripts": "2.4.6",
    "lolimadeupthispackage": "1.2.3"
  },
```

If you are using scripts from hubot-scripts, take note of the `Dependencies` documentation in the script to add. They are listed in a format that can be copy & pasted into `package.json`, just make sure to add commas as necessary to make it valid JSON.

# Timeouts and Intervals

Hubot can run code later using JavaScript's builtin [setTimeout](http://nodejs.org/api/timers.html#timers_settimeout_callback_delay_arg). It takes a callback method, and the amount of time to wait before calling it:

```coffeescript
module.exports = (robot) ->
  robot.respond /you are a little slow/, (msg)
    setTimeout () ->
      msg.send "Who you calling 'slow'?"
    , 60 * 1000
```

Additionally, Hubot can run code on an interval using [setInterval](http://nodejs.org/api/timers.html#timers_setinterval_callback_delay_arg). It takes a callback method, and the amount of time to wait between calls:

```coffeescript
module.exports = (robot) ->
  robot.respond /annoy me/, (msg)
    msg.send "Hey, want to hear the most annoying sound in the world?"
    setInterval () ->
      msg.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
    , 1000
```

Both `setTimeout` and `setInterval` return the ID of the timeout or interval it created. This can be used to to `clearTimeout` and `clearInterval`.

```coffeescript
module.exports = (robot) ->
  annoyIntervalId = null

  robot.respond /annoy me/, (msg)
    if annoyIntervalId
      msg.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
      return

    msg.send "Hey, want to hear the most annoying sound in the world?"
    annoyIntervalId = setInterval () ->
      msg.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
    , 1000

  robot.respond /unannoy me/, (msg)
    if annoyIntervalId
      msg.send "GUYS, GUYS, GUYS!"
      clearInterval(annoyIntervalId)
      annoyIntervalId = null
    else
      msg.send "Not annoying you right now, am I?"
```

## HTTP Listener

Hubot includes support for the [express](http://expressjs.com/guide.html) web framework to server up HTTP requests. It listens on the port specified by the `PORT` environment variable, and defaults to 8080. An instance of an express application is available at `robot.router`. It can be protected with username and password by specifying `EXPRESS_USER` and `EPXRESS_PASSWORD`. It can automatically server static files by setting `EXPRESS_STATIC`.

The most common use of this is for providing HTTP end points for services with webhooks to push to, and have those show up in chat.


```
module.exports = (robot) ->
  robot.router.post '/hubot/chatsecrets/:room', (req, res) ->
    room = req.params.room
    data = JSON.parse req.body.payload
    secret = data.secret

    robot.messageRoom "I have a secret: #{secret}"
```

## Events

Hubot can also respond to events which can be used to pass data between scripts. This is done by encapsulating node.js's [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with `robot.emit` and `robot.on`.

One use case for this would be to have one script for handling interactions with a service, and then emitting events as they come up. For example, we could have a script that receives data from a GitHub post-commit hook, make that emit commits as they come in, and then have another script act on those commits.

```coffeescript
# src/scripts/github-commits.coffee
module.exports = (robot) ->
  robot.router.post "/hubot/gh-commits", (req, res) ->
    robot.emit "commit", {
        user    : {}, #hubot user object
        repo    : 'https://github.com/github/hubot',
        hash  : '2e1951c089bd865839328592ff673d2f08153643'
    }
```

```coffeescript
# src/scripts/heroku.coffee
module.exports = (robot) ->
  robot.on "commit", (commit) ->
    robot.send commit.user, "Will now deploy #{commit.hash} from #{commit.repo}!"
    #deploy code goes here
```

If you provide an event, it's very recommended to include a hubot user or room object in its data. This would allow for hubot to notify a user or room in chat.

## TODO

* [ ] documenting scripts
* [ ] sharing code
