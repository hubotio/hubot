# Hubot

This is a version of GitHub's Campfire bot, hubot. He's <s>pretty<s> really
cool.

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
has written his own adapters.

1. Start a project for the npm package
2. Add `hubot` as a dependency to your `package.json` file
3. Add your main adapter file as the `main` file in `package.json`

Below is an example of requiring hubot to extend `Robot.Adapter` and exporting
a `use` function that will be used to load your adapter when used.

```coffeescript

Robot = require("hubot").robot()

class MyAdapter extends Robot.Adapter
  # You'll want to override the various methods see existing adapters
  # ...

exports.use = (robot) ->
  new MyAdapter robot

```

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
