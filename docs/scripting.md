# Scripting

Hubot out of the box doesn't do too much, but it is an extensible, scriptable robot friend.

## Anatomy of script loading

There are three main sources to load scripts from:

* all scripts __bundled__ with your hubot installation under `scripts/` dir
* __community scripts__ specified in `hubot-scripts.json` and shipped in the `hubot-scripts` npm package
* scripts loaded from external __npm packages__ and specified in `external-scripts.json`

### Community Scripts

To use community scripts, place the name of the script in the `hubot-scripts.json` file. For example:

```coffeescript
["redis-brain.coffee", "shipit.coffee", "whatis.coffee", "<new-script-name>.coffee"]
```

(Please check the [script catalog](http://hubot-script-catalog.herokuapp.com) and the [hubot-scripts repo](https://github.com/github/hubot-scripts/tree/master/src/scripts) for scripts carefully crafted for you by lots of nice folks)

### NPM Packages

Another way is to install scripts via an npm package (you can check some of them [here](https://npmjs.org/search?q=hubot)).

To load those scripts to your hubot installation, you need to place them in the `external-scripts.json` file after adding the required npm packages to the `package.json` dependency section.

Here is an example of adding the [hubot-botriot](https://npmjs.org/package/hubot-botriot) npm package:

```json
{
 ...

  "dependencies": {
    "hubot":         ">= 2.6.0 < 3.0.0",
    "hubot-scripts": ">= 2.5.0 < 3.0.0",
    "hubot-botriot": "",
  },

...
}
```

### Bundled Scripts

Last but not least, you can put your own scripts under the `scripts/` directory. All scripts placed there are automatically loaded and ready to use with your hubot.

You can also use this for customizing scripts from other sources. Just copy the *.coffee file into this directory and make whatever changes you'd like.

Instructions for writing your own scripts can be found below.

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
  robot.hear /badger/i, (msg) ->
    # your code here

  robot.respond /open the pod bay doors/i, (msg) ->
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
*  has anyone ever mentioned how lovely you are when you open pod bay doors?
   * because it lacks the robot's name

## Send & reply

The `msg` parameter is, despite the name, an instance of [Response](../src/response.coffee). With it, you can `send` a message back to the room the `msg` came from, `emote` a message to a room (If the given adapter supports it), or `reply` to the person that sent the message. For example:

```coffeescript
module.exports = (robot) ->
  robot.hear /badger/i, (msg) ->
    msg.send "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS"

  robot.respond /open the pod bay doors/i, (msg) ->
    msg.reply "I'm afraid I can't let you do that."

  robot.hear /I like pie/i, (msg) ->
    msg.emote "makes a freshly baked pie"
```

The `robot.hear /badgers/` callback sends a message exactly as specified regardless of who said it, "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS".

If a user Dave says "HAL: open the pod bay doors", `robot.respond /open the pod bay doors/i` callback sends a message "Dave: I'm afraid I can't let you do that."

## Capturing data

So far, our scripts have had static responses, which while amusing, are boring functionality-wise. `msg.match` has the result of `match`ing the incoming message against the regular expression. This is just a [JavaScript thing](http://www.w3schools.com/jsref/jsref_match.asp), which ends up being an array with index 0 being the full text matching the expression. If you include capture groups, those will be populated `msg.match`. For example, if we update a script like:

```coffeescript
  robot.respond /open the (.*) doors/i, (msg) ->
    # your code here
```

If Dave says "HAL: open the pod bay doors", then `msg.match[0]` is "open the pod bay doors", and `msg.match[1]` is just "pod bay". Now we can start doing more dynamic things:

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

A post looks like:

```coffeescript
  data = JSON.stringify({
    foo: 'bar'
  })
  robot.http("https://midnight-train")
    .post(data) (err, res, body) ->
      # your code here
```


`err` is an error encountered on the way, if one was encountered. You'll generally want to check for this and handle accordingly:

```coffeescript
  robot.http("https://midnight-train")
    .get() (err, res, body) ->
      if err
        msg.send "Encountered an error :( #{err}"
        return
      # your code here, knowing it was successful
```

`res` is an instance of node's [http.ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse). Most of the methods don't matter as much when using node-scoped-http-client, but of interest are `statusCode` and `getHeader`. Use `statusCode` to check for the HTTP status code, where usually non-200 means something bad happened. Use `getHeader` for peeking at the header, for example to check for rate limiting:

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

XML APIs are harder because there's not a bundled XML parsing library. It's beyond the scope of this documentation to go into detail, but here are a few libraries to check out:

* [xml2json](https://github.com/buglabs/node-xml2json) (simplest to use, but has some limitations)
* [jsdom](https://github.com/tmpvar/jsdom) (JavaScript implementation of the W3C DOM)
* [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)

### Screen scraping

For those times that there isn't an API, there's always the possibility of screen-scraping. It's beyond the scope of this documentation to go into detail, but here's a few libraries to check out:

* [cheerio](https://github.com/MatthewMueller/cheerio) (familiar syntax and API to jQuery)
* [jsdom](https://github.com/tmpvar/jsdom) (JavaScript implementation of the W3C DOM)

## Random

A common pattern is to hear or respond to commands, and send with a random funny image or line of text from an array of possibilities. It's annoying to do this in JavaScript and CoffeeScript out of the box, so Hubot includes a convenience method:

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

Hubot can see users entering and leaving, assuming that the adapter supports it.

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

Take care to make sure the script can load if it's not defined, give the Hubot developer notes on how to define it, or default to something. It's up to the script writer to decide if that should be a fatal error (e.g. hubot exits), or not (make any script that relies on it to say it needs to be configured. When possible and when it makes sense to, having a script work without any other configuration is preferred.

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

Hubot uses [npm](https://github.com/isaacs/npm) to manage its dependencies. To additional packages, add them to `dependencies` in `package.json`. For example, to add lolimadeupthispackage 1.2.3, it'd look like:

```json
  "dependencies": {
    "hubot":         "2.5.5",
    "hubot-scripts": "2.4.6",
    "lolimadeupthispackage": "1.2.3"
  },
```

If you are using scripts from hubot-scripts, take note of the `Dependencies` documentation in the script to add. They are listed in a format that can be copy & pasted into `package.json`, just make sure to add commas as necessary to make it valid JSON.

# Timeouts and Intervals

Hubot can run code later using JavaScript's built-in [setTimeout](http://nodejs.org/api/timers.html#timers_settimeout_callback_delay_arg). It takes a callback method, and the amount of time to wait before calling it:

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

Hubot includes support for the [express](http://expressjs.com/guide.html) web framework to serve up HTTP requests. It listens on the port specified by the `PORT` environment variable, and defaults to 8080. An instance of an express application is available at `robot.router`. It can be protected with username and password by specifying `EXPRESS_USER` and `EPXRESS_PASSWORD`. It can automatically serve static files by setting `EXPRESS_STATIC`.

The most common use of this is for providing HTTP end points for services with webhooks to push to, and have those show up in chat.


```coffeescript
module.exports = (robot) ->
  robot.router.post '/hubot/chatsecrets/:room', (req, res) ->
    room = req.params.room
    data = JSON.parse req.body.payload
    secret = data.secret

    robot.messageRoom room, "I have a secret: #{secret}"
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

If you provide an event, it's highly recommended to include a hubot user or room object in its data. This would allow for hubot to notify a user or room in chat.

## Error Handling

No code is perfect, and errors and exceptions are to be expected. Previously, an uncaught exceptions would crash your hubot instance. Hubot now includes an `uncaughtException` handler, which provides hooks for scripts to do something about exceptions.

```coffeescript
# src/scripts/does-not-compute.coffee
module.exports = (robot) ->
  robot.error (err, msg) ->
    robot.logger.error "DOES NOT COMPUTE"

    if msg?
      msg.reply "DOES NOT COMPUTE"
```

You can do anything you want here, but you will want to take extra precaution of rescuing and logging errors, particularly with asynchronous code. Otherwise, you might find yourself with recursive errors and not know what is going on.

Under the hood, there is an 'error' event emitted, with the error handlers consuming that event. The uncaughtException handler [technically leaves the process in an unknown state](http://nodejs.org/api/process.html#process_event_uncaughtexception). Therefore, you should rescue your own exceptions whenever possible, and emit them yourself. The first argument is the error emitted, and the second argument is an optional message that generated the error.

Using previous examples:

```coffeescript
  robot.router.post '/hubot/chatsecrets/:room', (req, res) ->
    room = req.params.room
    data = null
    try
      data = JSON.parse req.body.payload
    catch err
      robot.emit 'error', error

    # rest of the code here


  robot.hear /midnight train/i, (msg)
    robot.http("https://midnight-train")
      .get() (err, res, body) ->
        if err
          msg.reply "Had problems taking the midnight train"
          robot.emit 'error', err, msg
          return
        # rest of code here
```

For the second example, it's worth thinking about what messages the user would see. If you have an error handler that replies to the user, you may not need to add a custom

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

Hubot has an in-memory key-value store exposed as `robot.brain` that can be
used to store and retrieve data by scripts.

```coffeescript
module.exports = (robot) ->
  robot.respond /have a beer/i, (msg) ->
    # Get number of beers had (coerced to a number).
    beersHad = robot.brain.get('totalBeers') * 1 or 0

    if beersHad > 4
      msg.reply "I'm too drunk.."

    else
      msg.reply 'Sure!'

      robot.brain.set 'totalBeers', beersHad+1
      # Or robot.brain.set totalBeers: beersHad+1
```

If the script needs to lookup user data, there are methods on `robot.brain` for looking up one or many users by id, name, or 'fuzzy' matching of name: `userForName`, `userForId`, `userForFuzzyName`, and `usersForFuzzyName`.

```coffeescript
module.exports = (robot) ->

  robot.respond /who is @?([\w .\-]+)\?*$/i, (msg) ->
    name = msg.match[1].trim()

    users = robot.brain.usersForFuzzyName(name)
    if users.length is 1
      user = users[0]
      # Do something interesting here..

      msg.send "#{name} is user - #{user}"
```

## Script Load Order

Scripts are loaded from the `scripts/` directory. They are loaded in alphabetical order, so you can expect a consistent load order of scripts. For example:

* `scripts/1-first.coffee`
* `scripts/_second.coffee`
* `scripts/third.coffee

## Creating A Script Package

Creating a script package for hubot is very simple. Start by creating a normal
`npm` package. Make sure you add a main file for the entry point (e.g.
`index.js` or `index.coffee`).

In this entry point file you're going to have to export a function that hubot
will use to load the scripts in your package. Below is a simple example for
loading each script in a `./scripts` directory in your package.

```coffeescript
Fs   = require 'fs'
Path = require 'path'

module.exports = (robot) ->
  path = Path.resolve __dirname, 'scripts'
  Fs.exists path, (exists) ->
    if exists
      for file in Fs.readdirSync(path)
        robot.loadFile path, file
        robot.parseHelp Path.join(path, file)
```

After you've built your `npm` package you can publish it to [npmjs](http://npmjs.org).
