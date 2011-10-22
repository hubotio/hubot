# Hubot

This is a version of GitHub's Campfire bot, hubot. He's pretty cool.

You'll probably never have to hack on this repo directly.  Instead this
repo provides a library that's distributed by npm that you simply
require in your project.

We provide a generator to help you get a hubot going very quickly.

## Getting Your Own

Make sure you have [node.js](http://nodejs.org/), [npm](http://npmjs.org/), [redis](http://redis.io/), 
and [coffee-script](http://jashkenas.github.com/coffee-script/#installation) installed. Clone this repository, and run these commands:

    % npm install -g
    % hubot -c ~/my_bot

Then follow the instructions in the README in the `~/my_bot` directory.

## Scripts

Hubot ships with a couple of default scripts, but there's a whole big world out
there in the [hubot-scripts](https://github.com/github/hubot-scripts)
repository. `hubot-scripts` is a way to share scripts with the entire
community. Check out the
[README](https://github.com/github/hubot-scripts#readme) for more help on
installing individual scripts.

## Local Testing

Install all of the required dependencies by running `npm install`.

It's easy to test scripts locally with an interactive shell:

    % bin/hubot

...and to run tests:

    % make test
