Just because Hubot is asynchronous javascript doesn't mean it shouldn't have decent tests.  Hubot comes with the Danger Room, a training facility for the bulk of scripts.  Most Hubot scripts make HTTP requests somewhere, parse some output, and reply back to the user.  The Danger Room helps set up a test harness for that.

However, Hubot is not bound to any test framework.  There's a `make test` command that runs each file individually.

    test: deps
        @find test -name '*_test.coffee' | xargs -n 1 -t coffee

## Tour of Duty

The [Google Image tests](https://github.com/github/hubot/blob/master/test/google_images_test.coffee) are a great simple example.  First, let's load up the test harness:

```coffeescript
Tests  = require('./tests')
assert = require 'assert' # assert ftw
```

Now, we can load the script we're testing into the Helper bot, a custom Hubot for tests.  

```coffeescript
helper = Tests.helper()
require('../src/hubot/scripts/google-images') helper
```

We don't actually want our tests to hit Google Images, so we mock it.  The Danger Room spins up an http server, and lets you mock the response for the script.

```coffeescript
danger = Tests.danger helper, (req, res, url) ->
  res.writeHead 200
  res.end JSON.stringify(
    {responseData: {results: [
      {unescapedUrl: "(#{url.query.q})"}
    ]}}
  )
```

The `req` and `res` values are from http.createServer.  If you need to, you can check the request method, path, query parameters, etc.  Then, you return a value that your script can understand.  In our example, we simply return the `?q` query param in a recognizable format for the tests.

Now, we write the tests:

```coffeescript
mu    = "http://mustachify.me/?src="
tests = [
  (msg) -> assert.equal "#{mu}(foo)#.png", msg
  (msg) -> assert.equal "#{mu}(foo)#.png", msg
  (msg) -> assert.equal "#{mu}(foo)#.png", msg
  (msg) -> assert.equal "#{mu}(foo)#.png", msg
  (msg) -> assert.equal "(foo)#.png", msg
  (msg) -> assert.equal "(foo)#.png", msg
  (msg) -> assert.equal "(foo)#.png", msg
  (msg) -> assert.equal "(animated foo)#.png", msg
]
```

Each of these callbacks is called whenever the Helper bot sends a message.  If Helper is sending multiple messages, they will be available in the same callback:

```coffeescript
(msg1, msg2, msg3) -> ...
```

Our example tests are simple because the `imageMe()` logic is simple.  We're relying on Campfire's ability to display images with URLs ending in common image extensions.

Our last step is to actually run the test harness:

```coffeescript
danger.start tests, ->
  helper.receive 'helper: stache me foo'
  helper.receive 'helper: stache foo'
  helper.receive 'helper: mustache me foo'
  helper.receive 'helper: mustache foo'
  helper.receive 'helper: img foo'
  helper.receive 'helper: image me foo'
  helper.receive 'helper: image foo'
  helper.receive 'helper: animate me foo'
```

We start the Danger Room, and send some messages to Helper.  Helper checks them against the listeners and hopefully sends some messages that pass the assertions above.  Once the last callback has been called, the Danger Room and Helper both shut down so the next test can run.
