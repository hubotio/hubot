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

Adapters were moved out of the core of hubot to help reduce the number of
dependencies which were not really required depending on which adapter you
decided to use. Also the majority of pull requests were adapter related which
meant new releases had to be cut more often.

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
