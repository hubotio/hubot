---
permalink: /docs/scripting/
---

# Scripting

Hubot out of the box doesn't do too much but it is an extensible, scriptable robot friend. There are [hundreds of scripts written and maintained by the community](index.md#scripts) and it's easy to write your own.  You can create a custom script in hubot's `scripts` directory or [create a script package](#creating-a-script-package) for sharing with the community!

## Anatomy of a script

When you created your hubot, the generator also created a `scripts` directory. If you peek around there, you will see some examples of scripts. For a script to be a script, it needs to:

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
  robot.hear /badger/i, (res) ->
    # your code here

  robot.respond /open the pod bay doors/i, (res) ->
    # your code here
```

The `robot.hear /badger/` callback is called anytime a message's text matches. For example:

* Stop badgering the witness
* badger me
* what exactly is a badger anyways

The `robot.respond /open the pod bay doors/i` callback is only called for messages that are immediately preceded by the robot's name or alias. If the robot's name is HAL and alias is /, then this callback would be triggered for:

*  hal open the pod bay doors
* HAL: open the pod bay doors
* @HAL open the pod bay doors
* /open the pod bay doors

It wouldn't be called for:

* HAL: please open the pod bay doors
   *  because its `respond` is bound to the text immediately following the robot name
*  has anyone ever mentioned how lovely you are when you open the pod bay doors?
   * because it lacks the robot's name

## Send & reply

The `res` parameter is an instance of `Response` (historically, this parameter was `msg` and you may see other scripts use it this way). With it, you can `send` a message back to the room the `res` came from, `emote` a message to a room (If the given adapter supports it), or `reply` to the person that sent the message. For example:

```coffeescript
module.exports = (robot) ->
  robot.hear /badger/i, (res) ->
    res.send "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS"

  robot.respond /open the pod bay doors/i, (res) ->
    res.reply "I'm afraid I can't let you do that."

  robot.hear /I like pie/i, (res) ->
    res.emote "makes a freshly baked pie"
```

The `robot.hear /badgers/` callback sends a message exactly as specified regardless of who said it, "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS".

If a user Dave says "HAL: open the pod bay doors", `robot.respond /open the pod bay doors/i` callback sends a message "Dave: I'm afraid I can't let you do that."

## Messages to a room or user

Messages can be sent to a specified room or user using the messageRoom function.

```coffeescript
module.exports = (robot) ->

  robot.hear /green eggs/i, (res) ->
    room = "mytestroom"
    robot.messageRoom room, "I do not like green eggs and ham.  I do not like them sam-I-am."
```

User name can be explicitely specified if desired ( for a cc to an admin/manager), or using
the response object a private message can be sent to the original sender.

```coffeescript
  robot.respond /I don't like Sam-I-am/i, (res) ->
    room =  'joemanager'
    robot.messageRoom room, "Someone does not like Dr. Seus"
    res.reply  "That Sam-I-am\nThat Sam-I-am\nI do not like\nthat Sam-I-am"

  robot.hear /Sam-I-am/i, (res) ->
    room =  res.envelope.user.name
    robot.messageRoom room, "That Sam-I-am\nThat Sam-I-am\nI do not like\nthat Sam-I-am"
```

## Capturing data

So far, our scripts have had static responses, which while amusing, are boring functionality-wise. `res.match` has the result of `match`ing the incoming message against the regular expression. This is just a [JavaScript thing](http://www.w3schools.com/jsref/jsref_match.asp), which ends up being an array with index 0 being the full text matching the expression. If you include capture groups, those will be populated `res.match`. For example, if we update a script like:

```coffeescript
  robot.respond /open the (.*) doors/i, (res) ->
    # your code here
```

If Dave says "HAL: open the pod bay doors", then `res.match[0]` is "open the pod bay doors", and `res.match[1]` is just "pod bay". Now we can start doing more dynamic things:

```coffeescript
  robot.respond /open the (.*) doors/i, (res) ->
    doorType = res.match[1]
    if doorType is "pod bay"
      res.reply "I'm afraid I can't let you do that."
    else
      res.reply "Opening #{doorType} doors"
```

## Making HTTP calls

Hubot can make HTTP calls on your behalf to integrate & consume third party APIs. This can be through an instance of [node-scoped-http-client](https://github.com/technoweenie/node-scoped-http-client) available at `robot.http`. The simplest case looks like:


```coffeescript
  robot.http("https://midnight-train")
    .get() (err, response, body) ->
      # your code here
```

A post looks like:

```coffeescript
  data = JSON.stringify({
    foo: 'bar'
  })
  robot.http("https://midnight-train")
    .header('Content-Type', 'application/json')
    .post(data) (err, response, body) ->
      # your code here
```


`err` is an error encountered on the way, if one was encountered. You'll generally want to check for this and handle accordingly:

```coffeescript
  robot.http("https://midnight-train")
    .get() (err, response, body) ->
      if err
        res.send "Encountered an error :( #{err}"
        return
      # your code here, knowing it was successful
```

`res` is an instance of node's [http.ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse). Most of the methods don't matter as much when using node-scoped-http-client, but of interest are `statusCode` and `getHeader`. Use `statusCode` to check for the HTTP status code, where usually non-200 means something bad happened. Use `getHeader` for peeking at the header, for example to check for rate limiting:

```coffeescript
  robot.http("https://midnight-train")
    .get() (err, response, body) ->
      # pretend there's error checking code here

      if response.statusCode isnt 200
        res.send "Request didn't come back HTTP 200 :("
        return

      rateLimitRemaining = parseInt response.getHeader('X-RateLimit-Limit') if response.getHeader('X-RateLimit-Limit')
      if rateLimitRemaining and rateLimitRemaining < 1
        res.send "Rate Limit hit, stop believing for awhile"

      # rest of your code
```

`body` is the response's body as a string, the thing you probably care about the most:

```coffeescript
  robot.http("https://midnight-train")
    .get() (err, response, body) ->
      # error checking code here

      res.send "Got back #{body}"
```

### JSON

If you are talking to APIs, the easiest way is going to be JSON because it doesn't require any extra dependencies. When making the `robot.http` call, you should usually set the  `Accept` header to give the API a clue that's what you are expecting back. Once you get the `body` back, you can parse it with `JSON.parse`:

```coffeescript
  robot.http("https://midnight-train")
    .header('Accept', 'application/json')
    .get() (err, response, body) ->
      # error checking code here

      data = JSON.parse body
      res.send "#{data.passenger} taking midnight train going #{data.destination}"
```

It's possible to get non-JSON back, like if the API hit an error and it tries to render a normal HTML error instead of JSON. To be on the safe side, you should check the `Content-Type`, and catch any errors while parsing.

```coffeescript
  robot.http("https://midnight-train")
    .header('Accept', 'application/json')
    .get() (err, response, body) ->
      # err & response status checking code here

      if response.getHeader('Content-Type') isnt 'application/json'
        res.send "Didn't get back JSON :("
        return

      data = null
      try
        data = JSON.parse body
      catch error
       res.send "Ran into an error parsing JSON :("
       return

      # your code here
```

### XML

XML APIs are harder because there's not a bundled XML parsing library. It's beyond the scope of this documentation to go into detail, but here are a few libraries to check out:

* [xml2json](https://github.com/buglabs/node-xml2json) (simplest to use, but has some limitations)
* [jsdom](https://github.com/tmpvar/jsdom) (JavaScript implementation of the W3C DOM)
* [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)

### Screen scraping

For those times that there isn't an API, there's always the possibility of screen-scraping. It's beyond the scope of this documentation to go into detail, but here's a few libraries to check out:

* [cheerio](https://github.com/MatthewMueller/cheerio) (familiar syntax and API to jQuery)
* [jsdom](https://github.com/tmpvar/jsdom) (JavaScript implementation of the W3C DOM)


### Advanced HTTP and HTTPS settings

As mentioned, hubot uses [node-scoped-http-client](https://github.com/technoweenie/node-scoped-http-client) to provide a simple interface for making HTTP and HTTPS requests. Under its hood, it's using node's builtin [http](http://nodejs.org/api/http.html) and [https](http://nodejs.org/api/https.html) libraries, but providing an easy DSL for the most common kinds of interaction.

If you need to control options on http and https more directly, you pass a second argument to `robot.http` that will be passed on to node-scoped-http-client which will be passed on to http and https:

```
  options =
    # don't verify server certificate against a CA, SCARY!
    rejectUnauthorized: false
  robot.http("https://midnight-train", options)
```

In addition, if node-scoped-http-client doesn't suit you, you can use [http](http://nodejs.org/api/http.html) and [https](http://nodejs.org/api/https.html) yourself directly, or any other node library like [request](https://github.com/request/request).

## Random

A common pattern is to hear or respond to commands, and send with a random funny image or line of text from an array of possibilities. It's annoying to do this in JavaScript and CoffeeScript out of the box, so Hubot includes a convenience method:

```coffeescript
lulz = ['lol', 'rofl', 'lmao']

res.send res.random lulz
```

## Topic

Hubot can react to a room's topic changing, assuming that the adapter supports it.

```coffeescript
module.exports = (robot) ->
  robot.topic (res) ->
    res.send "#{res.message.text}? That's a Paddlin'"
```

## Entering and leaving

Hubot can see users entering and leaving, assuming that the adapter supports it.

```coffeescript
enterReplies = ['Hi', 'Target Acquired', 'Firing', 'Hello friend.', 'Gotcha', 'I see you']
leaveReplies = ['Are you still there?', 'Target lost', 'Searching']

module.exports = (robot) ->
  robot.enter (res) ->
    res.send res.random enterReplies
  robot.leave (res) ->
    res.send res.random leaveReplies
```

## Custom Listeners

While the above helpers cover most of the functionality the average user needs (hear, respond, enter, leave, topic), sometimes you would like to have very specialized matching logic for listeners. If so, you can use `listen` to specify a custom match function instead of a regular expression.

The match function must return a truthy value if the listener callback should be executed. The truthy return value of the match function is then passed to the callback as response.match.

```coffeescript
module.exports = (robot) ->
  robot.listen(
    (message) -> # Match function
      # only match messages with text (ie ignore enter and other events)
      return unless message.text

      # Occassionally respond to things that Steve says
      message.user.name is "Steve" and Math.random() > 0.8
    (response) -> # Standard listener callback
      # Let Steve know how happy you are that he exists
      response.reply "HI STEVE! YOU'RE MY BEST FRIEND! (but only like #{response.match * 100}% of the time)"
  )
```

See [the design patterns document](patterns.md#dynamic-matching-of-messages) for examples of complex matchers.

## Environment variables

Hubot can access the environment he's running in, just like any other node program, using [`process.env`](http://nodejs.org/api/process.html#process_process_env). This can be used to configure how scripts are run, with the convention being to use the `HUBOT_` prefix.

```coffeescript
answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING

module.exports = (robot) ->
  robot.respond /what is the answer to the ultimate question of life/, (res) ->
    res.send "#{answer}, but what is the question?"
```

Take care to make sure the script can load if it's not defined, give the Hubot developer notes on how to define it, or default to something. It's up to the script writer to decide if that should be a fatal error (e.g. hubot exits), or not (make any script that relies on it to say it needs to be configured. When possible and when it makes sense to, having a script work without any other configuration is preferred.

Here we can default to something:

```coffeescript
answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING or 42

module.exports = (robot) ->
  robot.respond /what is the answer to the ultimate question of life/, (res) ->
    res.send "#{answer}, but what is the question?"
```

Here we exit if it's not defined:

```coffeescript
answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING
unless answer?
  console.log "Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again"
  process.exit(1)

module.exports = (robot) ->
  robot.respond /what is the answer to the ultimate question of life/, (res) ->
    res.send "#{answer}, but what is the question?"
```

And lastly, we update the `robot.respond` to check it:

```coffeescript
answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING

module.exports = (robot) ->
  robot.respond /what is the answer to the ultimate question of life/, (res) ->
    unless answer?
      res.send "Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again"
      return
    res.send "#{answer}, but what is the question?"
```

## Dependencies

Hubot uses [npm](https://github.com/isaacs/npm) to manage its dependencies. To add additional packages, add them to `dependencies` in `package.json`. For example, to add lolimadeupthispackage 1.2.3, it'd look like:

```json
  "dependencies": {
    "hubot":         "2.5.5",
    "lolimadeupthispackage": "1.2.3"
  },
```

If you are using scripts from hubot-scripts, take note of the `Dependencies` documentation in the script to add. They are listed in a format that can be copy & pasted into `package.json`, just make sure to add commas as necessary to make it valid JSON.

# Timeouts and Intervals

Hubot can run code later using JavaScript's built-in [setTimeout](http://nodejs.org/api/timers.html#timers_settimeout_callback_delay_arg). It takes a callback method, and the amount of time to wait before calling it:

```coffeescript
module.exports = (robot) ->
  robot.respond /you are a little slow/, (res) ->
    setTimeout () ->
      res.send "Who you calling 'slow'?"
    , 60 * 1000
```

Additionally, Hubot can run code on an interval using [setInterval](http://nodejs.org/api/timers.html#timers_setinterval_callback_delay_arg). It takes a callback method, and the amount of time to wait between calls:

```coffeescript
module.exports = (robot) ->
  robot.respond /annoy me/, (res) ->
    res.send "Hey, want to hear the most annoying sound in the world?"
    setInterval () ->
      res.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
    , 1000
```

Both `setTimeout` and `setInterval` return the ID of the timeout or interval it created. This can be used to to `clearTimeout` and `clearInterval`.

```coffeescript
module.exports = (robot) ->
  annoyIntervalId = null

  robot.respond /annoy me/, (res) ->
    if annoyIntervalId
      res.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
      return

    res.send "Hey, want to hear the most annoying sound in the world?"
    annoyIntervalId = setInterval () ->
      res.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
    , 1000

  robot.respond /unannoy me/, (res) ->
    if annoyIntervalId
      res.send "GUYS, GUYS, GUYS!"
      clearInterval(annoyIntervalId)
      annoyIntervalId = null
    else
      res.send "Not annoying you right now, am I?"
```

## HTTP Listener

Hubot includes support for the [express](http://expressjs.com) web framework to serve up HTTP requests. It listens on the port specified by the `EXPRESS_PORT` or `PORT` environment variables (preferred in that order) and defaults to 8080. An instance of an express application is available at `robot.router`. It can be protected with username and password by specifying `EXPRESS_USER` and `EXPRESS_PASSWORD`. It can automatically serve static files by setting `EXPRESS_STATIC`.

You can increase the [maximum request body size](https://github.com/expressjs/body-parser#limit-3) by specifying `EXPRESS_LIMIT`. It defaults to '100kb'.  You can also set the [maximum number of parameters](https://github.com/expressjs/body-parser#parameterlimit) that are allowed in the URL-encoded data by setting `EXPRESS_PARAMETER_LIMIT`. The default is `1000`.

The most common use of this is for providing HTTP end points for services with webhooks to push to, and have those show up in chat.


```coffeescript
module.exports = (robot) ->
  # the expected value of :room is going to vary by adapter, it might be a numeric id, name, token, or some other value
  robot.router.post '/hubot/chatsecrets/:room', (request, response) ->
    room   = request.params.room
    data   = if request.body.payload? then JSON.parse request.body.payload else request.body
    secret = data.secret

    robot.messageRoom room, "I have a secret: #{secret}"

    response.send 'OK'
```

Test it with curl; also see section on [error handling](#error-handling) below.
```shell
// raw json, must specify Content-Type: application/json
curl -X POST -H "Content-Type: application/json" -d '{"secret":"C-TECH Astronomy"}' http://127.0.0.1:8080/hubot/chatsecrets/general

// defaults Content-Type: application/x-www-form-urlencoded, must st payload=...
curl -d 'payload=%7B%22secret%22%3A%22C-TECH+Astronomy%22%7D' http://127.0.0.1:8080/hubot/chatsecrets/general
```

All endpoint URLs should start with the literal string `/hubot` (regardless of what your robot's name is). This consistency makes it easier to set up webhooks (copy-pasteable URL) and guarantees that URLs are valid (not all bot names are URL-safe).

## Events

Hubot can also respond to events which can be used to pass data between scripts. This is done by encapsulating node.js's [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with `robot.emit` and `robot.on`.

One use case for this would be to have one script for handling interactions with a service, and then emitting events as they come up. For example, we could have a script that receives data from a GitHub post-commit hook, make that emit commits as they come in, and then have another script act on those commits.

```coffeescript
# src/scripts/github-commits.coffee
module.exports = (robot) ->
  robot.router.post "/hubot/gh-commits", (request, response) ->
    robot.emit "commit", {
        user    : {}, #hubot user object
        repo    : 'https://github.com/github/hubot',
        hash    : '2e1951c089bd865839328592ff673d2f08153643'
    }
```

```coffeescript
# src/scripts/heroku.coffee
module.exports = (robot) ->
  robot.on "commit", (commit) ->
    robot.send commit.user, "Will now deploy #{commit.hash} from #{commit.repo}!"
    #deploy code goes here
```

If you provide an event, it's highly recommended to include a hubot user or room object in its data. This would allow for hubot to notify a user or room in chat.

## Error Handling

No code is perfect, and errors and exceptions are to be expected. Previously, an uncaught exceptions would crash your hubot instance. Hubot now includes an `uncaughtException` handler, which provides hooks for scripts to do something about exceptions.

```coffeescript
# src/scripts/does-not-compute.coffee
module.exports = (robot) ->
  robot.error (err, res) ->
    robot.logger.error "DOES NOT COMPUTE"

    if res?
      res.reply "DOES NOT COMPUTE"
```

You can do anything you want here, but you will want to take extra precaution of rescuing and logging errors, particularly with asynchronous code. Otherwise, you might find yourself with recursive errors and not know what is going on.

Under the hood, there is an 'error' event emitted, with the error handlers consuming that event. The uncaughtException handler [technically leaves the process in an unknown state](http://nodejs.org/api/process.html#process_event_uncaughtexception). Therefore, you should rescue your own exceptions whenever possible, and emit them yourself. The first argument is the error emitted, and the second argument is an optional message that generated the error.

Using previous examples:

```coffeescript
  robot.router.post '/hubot/chatsecrets/:room', (request, response) ->
    room = request.params.room
    data = null
    try
      data = JSON.parse request.body.payload
    catch err
      robot.emit 'error', err

    # rest of the code here


  robot.hear /midnight train/i, (res) ->
    robot.http("https://midnight-train")
      .get() (err, response, body) ->
        if err
          res.reply "Had problems taking the midnight train"
          robot.emit 'error', err, res
          return
        # rest of code here
```

For the second example, it's worth thinking about what messages the user would see. If you have an error handler that replies to the user, you may not need to add a custom message and could send back the error message provided to the `get()` request, but of course it depends on how public you want to be with your exception reporting.

## Documenting Scripts

Hubot scripts can be documented with comments at the top of their file, for example:

```coffeescript
# Description:
#   <description of the scripts functionality>
#
# Dependencies:
#   "<module name>": "<module version>"
#
# Configuration:
#   LIST_OF_ENV_VARS_TO_SET
#
# Commands:
#   hubot <trigger> - <what the respond trigger does>
#   <trigger> - <what the hear trigger does>
#
# Notes:
#   <optional notes required for the script>
#
# Author:
#   <github username of the original script author>
```

The most important and user facing of these is `Commands`. At load time, Hubot looks at the `Commands` section of each scripts, and build a list of all commands. The included `help.coffee` lets a user ask for help across all commands, or with a search. Therefore, documenting the commands make them a lot more discoverable by users.

When documenting commands, here are some best practices:

* Stay on one line. Help commands get sorted, so would insert the second line at an unexpected location, where it probably won't make sense.
* Refer to the Hubot as hubot, even if your hubot is named something else. It will automatically be replaced with the correct name. This makes it easier to share scripts without having to update docs.
* For `robot.respond` documentation, always prefix with `hubot`. Hubot will automatically replace this with your robot's name, or the robot's alias if it has one
* Check out how man pages document themselves. In particular, brackets indicate optional parts, '...' for any number of arguments, etc.

The other sections are more relevant to developers of the bot, particularly dependencies, configuration variables, and notes. All contributions to [hubot-scripts](https://github.com/github/hubot-scripts) should include all these sections that are related to getting up and running with the script.



## Persistence

Hubot has two persistence methods available that can be
used to store and retrieve data by scripts: an in-memory key-value store exposed as `robot.brain`, and an optional persistent database-backed key-value store expsoed as `robot.datastore`

### Brain

```coffeescript
robot.respond /have a soda/i, (res) ->
  # Get number of sodas had (coerced to a number).
  sodasHad = robot.brain.get('totalSodas') * 1 or 0

  if sodasHad > 4
    res.reply "I'm too fizzy.."
  else
    res.reply 'Sure!'
    robot.brain.set 'totalSodas', sodasHad + 1

robot.respond /sleep it off/i, (res) ->
  robot.brain.set 'totalSodas', 0
  res.reply 'zzzzz'
```

If the script needs to lookup user data, there are methods on `robot.brain` for looking up one or many users by id, name, or 'fuzzy' matching of name: `userForName`, `userForId`, `userForFuzzyName`, and `usersForFuzzyName`.

```coffeescript
module.exports = (robot) ->

  robot.respond /who is @?([\w .\-]+)\?*$/i, (res) ->
    name = res.match[1].trim()

    users = robot.brain.usersForFuzzyName(name)
    if users.length is 1
      user = users[0]
      # Do something interesting here..

      res.send "#{name} is user - #{user}"
```

### Datastore

Unlike the brain, the datastore's getter and setter methods are asynchronous and don't resolve until the call to the underlying database has resolved. This requires a slightly different approach to accessing data:

```coffeescript
robot.respond /have a soda/i, (res) ->
  # Get number of sodas had (coerced to a number).
  robot.datastore.get('totalSodas').then (value) ->
    sodasHad = value * 1 or 0

    if sodasHad > 4
      res.reply "I'm too fizzy.."
    else
      res.reply 'Sure!'
      robot.brain.set 'totalSodas', sodasHad + 1

robot.respond /sleep it off/i, (res) ->
  robot.datastore.set('totalSodas', 0).then () ->
    res.reply 'zzzzz'
```

The datastore also allows setting and getting values which are scoped to individual users:

```coffeescript
module.exports = (robot) ->

  robot.respond /who is @?([\w .\-]+)\?*$/i, (res) ->
    name = res.match[1].trim()

    users = robot.brain.usersForFuzzyName(name)
    if users.length is 1
      user = users[0]
      user.get('roles').then (roles) ->
        res.send "#{name} is #{roles.join(', ')}"
```

## Script Loading

There are three main sources to load scripts from:

* all scripts __bundled__ with your hubot installation under `scripts/` directory
* __community scripts__ specified in `hubot-scripts.json` and shipped in the `hubot-scripts` npm package
* scripts loaded from external __npm packages__ and specified in `external-scripts.json`

Scripts loaded from the `scripts/` directory are loaded in alphabetical order, so you can expect a consistent load order of scripts. For example:

* `scripts/1-first.coffee`
* `scripts/_second.coffee`
* `scripts/third.coffee`

# Sharing Scripts

Once you've built some new scripts to extend the abilities of your robot friend, you should consider sharing them with the world! At the minimum, you need to package up your script and submit it to the [Node.js Package Registry](http://npmjs.org). You should also review the best practices for sharing scripts below.

## See if a script already exists

Start by [checking if an NPM package](index.md#scripts) for a script like yours already exists.  If you don't see an existing package that you can contribute to, then you can easily get started using the `hubot` script [yeoman](http://yeoman.io/) generator.

## Creating A Script Package

Creating a script package for hubot is very simple.  Start by installing the `hubot` [yeoman](http://yeoman.io/) generator:


```
% npm install -g yo generator-hubot
```

Once you've got the hubot generator installed, creating a hubot script is similar to creating a new hubot.  You create a directory for your hubot script and generate a new `hubot:script` in it.  For example, if we wanted to create a hubot script called "my-awesome-script":

```
% mkdir hubot-my-awesome-script
% cd hubot-my-awesome-script
% yo hubot:script
```

At this point, you'll be asked a few questions about the author of the script, name of the script (which is guessed by the directory name), a short description, and keywords to find it (we suggest having at least `hubot, hubot-scripts` in this list).

If you are using git, the generated directory includes a .gitignore, so you can initialize and add everything:

```
% git init
% git add .
% git commit -m "Initial commit"
```

You now have a hubot script repository that's ready to roll! Feel free to crack open the pre-created `src/awesome-script.coffee` file and start building up your script! When you've got it ready, you can publish it to [npmjs](http://npmjs.org) by [following their documentation](https://docs.npmjs.com/getting-started/publishing-npm-packages)!

You'll probably want to write some unit tests for your new script.  A sample test script is written to
`test/awesome-script-test.coffee`, which you can run with `grunt`.  For more information on tests,
see the [Testing Hubot Scripts](#testing-hubot-scripts) section.

# Listener Metadata

In addition to a regular expression and callback, the `hear` and `respond` functions also accept an optional options Object which can be used to attach arbitrary metadata to the generated Listener object. This metadata allows for easy extension of your script's behavior without modifying the script package.

The most important and most common metadata key is `id`. Every Listener should be given a unique name (options.id; defaults to `null`). Names should be scoped by module (e.g. 'my-module.my-listener'). These names allow other scripts to directly address individual listeners and extend them with additional functionality like authorization and rate limiting.

Additional extensions may define and handle additional metadata keys. For more information, see the [Listener Middleware section](#listener-middleware).

Returning to an earlier example:

```coffeescript
module.exports = (robot) ->
  robot.respond /annoy me/, id:'annoyance.start', (res)
    # code to annoy someone

  robot.respond /unannoy me/, id:'annoyance.stop', (res)
    # code to stop annoying someone
```

These scoped identifiers allow you to externally specify new behaviors like:
- authorization policy: "allow everyone in the `annoyers` group to execute `annoyance.*` commands"
- rate limiting: "only allow executing `annoyance.start` once every 30 minutes"

# Middleware

There are three kinds of middleware: Receive, Listener and Response.

Receive middleware runs once, before listeners are checked.
Listener middleware runs for every listener that matches the message.
Response middleware runs for every response sent to a message.

## Execution Process and API

Similar to [Express middleware](http://expressjs.com/api.html#middleware), Hubot executes middleware in definition order. Each middleware can either continue the chain (by calling `next`) or interrupt the chain (by calling `done`). If all middleware continues, the listener callback is executed and `done` is called. Middleware may wrap the `done` callback to allow executing code in the second half of the process (after the listener callback has been executed or a deeper piece of middleware has interrupted).

Middleware is called with:

- `context`
  - See the each middleware type's API to see what the context will expose.
- `next`
  - a Function with no additional properties that should be called to continue on to the next piece of middleware/execute the Listener callback
  - `next` should be called with a single, optional argument: either the provided `done` function or a new function that eventually calls `done`. If the argument is not given, the provided `done` will be assumed.
- `done`
 - a Function with no additional properties that should be called to interrupt middleware execution and begin executing the chain of completion functions.
 - `done` should be called with no arguments

Every middleware receives the same API signature of `context`, `next`, and
`done`. Different kinds of middleware may receive different information in the
`context` object. For more details, see the API for each type of middleware.

### Error Handling

For synchronous middleware (never yields to the event loop), hubot will automatically catch errors and emit an an `error` event, just like in standard listeners. Hubot will also automatically call the most recent `done` callback to unwind the middleware stack. Asynchronous middleware should catch its own exceptions, emit an `error` event, and call `done`. Any uncaught exceptions will interrupt all execution of middleware completion callbacks.

# Listener Middleware

Listener middleware inserts logic between the listener matching a message and the listener executing. This allows you to create extensions that run for every matching script. Examples include centralized authorization policies, rate limiting, logging, and metrics. Middleware is implemented like other hubot scripts: instead of using the `hear` and `respond` methods, middleware is registered using `listenerMiddleware`.

## Listener Middleware Examples

A fully functioning example can be found in [hubot-rate-limit](https://github.com/michaelansel/hubot-rate-limit/blob/master/src/rate-limit.coffee).

A simple example of middleware logging command executions:

```coffeescript
module.exports = (robot) ->
  robot.listenerMiddleware (context, next, done) ->
    # Log commands
    robot.logger.info "#{context.response.message.user.name} asked me to #{context.response.message.text}"
    # Continue executing middleware
    next()
```

In this example, a log message will be written for each chat message that matches a Listener.

A more complex example making a rate limiting decision:

```coffeescript
module.exports = (robot) ->
  # Map of listener ID to last time it was executed
  lastExecutedTime = {}

  robot.listenerMiddleware (context, next, done) ->
    try
      # Default to 1s unless listener provides a different minimum period
      minPeriodMs = context.listener.options?.rateLimits?.minPeriodMs? or 1000

      # See if command has been executed recently
      if lastExecutedTime.hasOwnProperty(context.listener.options.id) and
         lastExecutedTime[context.listener.options.id] > Date.now() - minPeriodMs
        # Command is being executed too quickly!
        done()
      else
        next ->
          lastExecutedTime[context.listener.options.id] = Date.now()
          done()
    catch err
      robot.emit('error', err, context.response)
```

In this example, the middleware checks to see if the listener has been executed in the last 1,000ms. If it has, the middleware calls `done` immediately, preventing the listener callback from being called. If the listener is allowed to execute, the middleware attaches a `done` handler so that it can record the time the listener *finished* executing.

This example also shows how listener-specific metadata can be leveraged to create very powerful extensions: a script developer can use the rate limiting middleware to easily rate limit commands at different rates by just adding the middleware and setting a listener option.

```coffeescript
module.exports = (robot) ->
  robot.hear /hello/, id: 'my-hello', rateLimits: {minPeriodMs: 10000}, (res) ->
    # This will execute no faster than once every ten seconds
    res.reply 'Why, hello there!'
```

## Listener Middleware API

Listener middleware callbacks receive three arguments, `context`, `next`, and
`done`. See the [middleware API](#execution-process-and-api) for a description
of `next` and `done`. Listener middleware context includes these fields:
  - `listener`
    - `options`: a simple Object containing options set when defining the listener. See [Listener Metadata](#listener-metadata).
    - all other properties should be considered internal
  - `response`
    - all parts of the standard response API are included in the middleware API. See [Send & Reply](#send--reply).
    - middleware may decorate (but not modify) the response object with additional information (e.g. add a property to `response.message.user` with a user's LDAP groups)
    - note: the textual message (`response.message.text`) should be considered immutable in listener middleware

# Receive Middleware

Receive middleware runs before any listeners have executed. It's suitable for
blacklisting commands that have not been updated to add an ID, metrics, and more.

## Receive Middleware Example

This simple middlware bans hubot use by a particular user, including `hear`
listeners. If the user attempts to run a command explicitly, it will return
an error message.

```coffeescript
BLACKLISTED_USERS = [
  '12345' # Restrict access for a user ID for a contractor
]

robot.receiveMiddleware (context, next, done) ->
  if context.response.message.user.id in BLACKLISTED_USERS
    # Don't process this message further.
    context.response.message.finish()

    # If the message starts with 'hubot' or the alias pattern, this user was
    # explicitly trying to run a command, so respond with an error message.
    if context.response.message.text?.match(robot.respondPattern(''))
      context.response.reply "I'm sorry @#{context.response.message.user.name}, but I'm configured to ignore your commands."

    # Don't process further middleware.
    done()
  else
    next(done)
```

## Receive Middleware API

Receive middleware callbacks receive three arguments, `context`, `next`, and
`done`. See the [middleware API](#execution-process-and-api) for a description
of `next` and `done`. Receive middleware context includes these fields:
  - `response`
    - this response object will not have a `match` property, as no listeners have been run yet to match it.
    - middleware may decorate the response object with additional information (e.g. add a property to `response.message.user` with a user's LDAP groups)
    - middleware may modify the `response.message` object

# Response Middleware

Response middleware runs against every message hubot sends to a chat room. It's
helpful for message formatting, preventing password leaks, metrics, and more.

## Response Middleware Example

This simple example changes the format of links sent to a chat room from
markdown links (like [example](https://example.com)) to the format supported
by [Slack](https://slack.com), <https://example.com|example>.

```coffeescript
module.exports = (robot) ->
  robot.responseMiddleware (context, next, done) ->
    return unless context.plaintext?
    context.strings = (string.replace(/\[([^\[\]]*?)\]\((https?:\/\/.*?)\)/, "<$2|$1>") for string in context.strings)
    next()
```

## Response Middleware API

Response middleware callbacks receive three arguments, `context`, `next`, and
`done`. See the [middleware API](#execution-process-and-api) for a description
of `next` and `done`. Receive middleware context includes these fields:
  - `response`
    - This response object can be used to send new messages from the middleware. Middleware will be called on these new responses. Be careful not to create infinite loops.
  - `strings`
    - An array of strings being sent to the chat room adapter. You can edit these, or use `context.strings = ["new strings"]` to replace them.
  - `method`
    - A string representing which type of response message the listener sent, such as `send`, `reply`, `emote` or `topic`.
  - `plaintext`
    - `true` or `undefined`. This will be set to `true` if the message is of a normal plaintext type, such as `send` or `reply`. This property should be treated as read-only.

# Testing Hubot Scripts

[hubot-test-helper](https://github.com/mtsmfm/hubot-test-helper) is a good
framework for unit testing Hubot scripts.  (Note that, in order to use
hubot-test-helper, you'll need a recent Node version with support for Promises.)

Install the package in your Hubot instance:

``` % npm install hubot-test-helper --save-dev ```

You'll also need to install:

 * a JavaScript testing framework such as *Mocha*
 * an assertion library such as *chai* or *expect.js*

You may also want to install:

 * *coffeescript* (if you're writing your tests in CoffeeScript rather than JavaScript)
 * a mocking library such as *Sinon.js* (if your script performs webservice calls or
   other asynchronous actions)

Here is a sample script that tests the first couple of commands in the
[Hubot sample script](https://github.com/hubotio/generator-hubot/blob/master/generators/app/templates/scripts/example.coffee).  This script uses *Mocha*, *chai*, *coffeescript*, and of course *hubot-test-helper*:

**test/example-test.coffee**
```coffeescript
Helper = require('hubot-test-helper')
chai = require 'chai'

expect = chai.expect

helper = new Helper('../scripts/example.coffee')

describe 'example script', ->
  beforeEach ->
    @room = helper.createRoom()

  afterEach ->
    @room.destroy()

  it 'doesn\'t need badgers', ->
    @room.user.say('alice', 'did someone call for a badger?').then =>
      expect(@room.messages).to.eql [
        ['alice', 'did someone call for a badger?']
        ['hubot', 'Badgers? BADGERS? WE DON\'T NEED NO STINKIN BADGERS']
      ]

  it 'won\'t open the pod bay doors', ->
    @room.user.say('bob', '@hubot open the pod bay doors').then =>
      expect(@room.messages).to.eql [
        ['bob', '@hubot open the pod bay doors']
        ['hubot', '@bob I\'m afraid I can\'t let you do that.']
      ]

  it 'will open the dutch doors', ->
    @room.user.say('bob', '@hubot open the dutch doors').then =>
      expect(@room.messages).to.eql [
        ['bob', '@hubot open the dutch doors']
        ['hubot', '@bob Opening dutch doors']
      ]
```

**sample output**
```bash
% mocha --require coffeescript/register test/*.coffee


  example script
    ✓ doesn't need badgers
    ✓ won't open the pod bay doors
    ✓ will open the dutch doors


  3 passing (212ms)
```
