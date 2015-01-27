# Adapters: Test

The test adapter provides a simple way to test what hubot would've responded to in your own scripts.
It can be useful for testing scripts that you distribute via npm.

## Getting Started

```coffeescript
Path  = require("path")
Robot = require("hubot").Robot

pkg = require Path.join __dirname, "..", 'package.json'
testAdapter = Path.join(__dirname, "adapters")

Version = pkg.version

describe "The Hubot Script", () ->
  robot = null
  beforeEach () ->
    robot = new Robot testAdapter, "test", false, "hubot"
    robot.loadFile  Path.join(__dirname, "..", "src"), "script.coffee"
    robot.run()

  afterEach () ->
    robot.shutdown()

  it "displays the version", () ->
    robot.adapter.receiveText("hubot deploy:version")
    expected = "hubot-deploy v#{Version}/hubot v2.7.5/node v0.10.21"
    assert.equal expected, robot.adapter.history
```

## Configuring

This adapter doesn't require any configuration.
