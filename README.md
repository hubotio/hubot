# Hubot

Hubot is a chat bot, modelled after GitHub's Campfire bot, hubot. He's pretty cool. He's extendable with [community scripts](https://github.com/github/hubot-scripts) and your own custom scripts, and can work on [many different chat services](docs/adapters.md).

**You'll probably never have to hack on this repo directly.**

Instead this repo provides a library that's distributed by `npm` that you
simply require in your project. Follow the instructions below and get your own
hubot ready to deploy.

## Installing

You will need [node.js](nodejs.org/) and [npm](https://npmjs.org/). Joyent has an [excellent blog post on how to those installed](http://joyent.com/blog/installing-node-and-npm), so we'll omit detailing that here for right now.

Once node and npm are ready, we can install hubot and coffeescript:

    % npm install -g hubot coffeescript
    
This will give us the `hubot` script, which is used for running a hubot, but more importantly to start, generating your own hubot. The name of the new bot is the last argument, and will be created in the directory of the same name. For example, to create a new bot named bender:

    % hubot --create bender

## Hacking

Coming soon...

## Contributing

Coming soon...

## License

Copyright (c) 2011-2013 GitHub, Inc. See the LICENSE file for license rights and
limitations (MIT).
