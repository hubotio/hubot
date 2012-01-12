# Hubot

This is a version of GitHub's Campfire bot, hubot. He's pretty cool.

**You'll probably never have to hack on this repo directly.**

Instead this repo provides a library that's distributed by `npm` that you
simply require in your project. Follow the instructions below and get your own
hubot ready to deploy.

## Getting your own

Make sure you have [node.js][nodejs] and [npm][npmjs] (npm comes with node v0.6.5+) installed.

Download the [latest version of hubot][hubot-latest].

Then follow the instructions in the [README][readme] in the extracted `hubot`
directory.

[nodejs]: http://nodejs.org
[npmjs]: http://npmjs.org
[hubot-latest]: https://github.com/github/hubot/downloads
[readme]: https://github.com/github/hubot/blob/master/src/templates/README.md

## Adapters

Adapters are the interface to the service you want your hubot to run on. This
can be something like Campfire or IRC. There are a number of third party
adapters that the community have contributed. Check the
[hubot wiki][hubot-wiki] for the available ones and how to create your own.

Please submit issues and pull requests for third party adapters to the adapter
repo not this repo unless it's the Campfire or Shell adapter.

[hubot-wiki]: https://github.com/github/hubot/wiki
[third-party-adapters]: https://github.com/github/hubot/tree/master/src/adapters/third-party
[split-subpath]: http://help.github.com/split-a-subpath-into-a-new-repo/
[logjs]: https://github.com/visionmedia/log.js

## hubot-scripts

Hubot ships with a number of default scripts, but there's a growing number of
extras in the [hubot-scripts][hubot-scripts] repository. `hubot-scripts` is a
way to share scripts with the entire community.

Check out the [README][hubot-scripts-readme] for more help on installing
individual scripts.

[hubot-scripts]: https://github.com/github/hubot-scripts
[hubot-scripts-readme]: https://github.com/github/hubot-scripts#readme

## HTTP Listener

Hubot has a HTTP listener which listens on the port specified by the `PORT`
environment variable.

You can specify routes to listen on in your scripts by using the `router`
property on `robot`.

```coffeescript
module.exports = (robot) ->
  robot.router.get "/hubot/version", (req, res) ->
    res.end robot.version
```

There are functions for GET, POST, PUT and DELETE, which all take a route and
callback function that accepts a request and a response.

## Testing hubot locally

Install all of the required dependencies by running `npm install`.

It's easy to test scripts locally with an interactive shell:

    % export PATH="node_modules/.bin:$PATH"
    % bin/hubot

... and to run unit tests:

    % make test

