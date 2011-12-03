# Hubot

This is a version of GitHub's Campfire bot, hubot. He's pretty cool.

You'll probably never have to hack on this repo directly. Instead this repo
provides a library that's distributed by npm that you simply require in your
project.

## Getting Your Own

Make sure you have [node.js](http://nodejs.org/) and [npm](http://npmjs.org/)
installed.

Download the [latest version of hubot](https://github.com/github/hubot/downloads).

Then follow the instructions in the README in the `hubot` directory.

## Adapters

Hubot ships with Campfire and Shell adapters. A number of third-party adapters
exist which you can install with npm and then use that with your hubot.

### Creating an Adapter

Creating an adapter for hubot is very simple. So simple infact hubot himself
has written his own adapters. Adapters in the
[third-party](https://github.com/github/hubot/tree/master/src/adapters/third-party)
directory will need to have ownership claimed preferably by the original
contributor.

1. Start a project for the hubot adapter npm package
2. Add your main adapter file as the `main` file in `package.json`

**NOTE**: If you've already released an adapter, remove the hubot dependecy
from the `package.json` file as this causes hubot to be installed twice
and causes some issues.

Below is an example of requiring hubot to extend `Adapter` and exporting
a `use` function that will be used to load your adapter when used.

You will also have access to a `@robot.logger` instance which you can use
for logging. Check out [log.js](https://github.com/visionmedia/log.js) for more
information about the logging library used in hubot.

```coffeescript

Robot   = require("hubot").robot()
Adapter = require("hubot").adapter()

class MyAdapter extends Adapter
  # You'll want to override the various methods see existing adapters
  # ...

exports.use = (robot) ->
  new MyAdapter robot

```

Please submit issues and pull requests for third party adapters to the adapter
repo not this repo unless it's the Campfire or Shell adapter.

## Scripts

Hubot ships with a number of default scripts, but there's a growing number of
extras in the [hubot-scripts](https://github.com/github/hubot-scripts)
repository. `hubot-scripts` is a way to share scripts with the entire
community.

Check out the [README](https://github.com/github/hubot-scripts#readme)
for more help on installing individual scripts.

## Local Testing

Install all of the required dependencies by running `npm install`.

It's easy to test scripts locally with an interactive shell:

    % export PATH="node_modules/.bin:$PATH"
    % bin/hubot

... and to run tests:

    % make test

