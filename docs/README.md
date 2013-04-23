# Hubot

## Getting Started With Hubot

You will need [node.js](nodejs.org/) and [npm](https://npmjs.org/). Joyent has an [excellent blog post on how to those installed](http://joyent.com/blog/installing-node-and-npm), so we'll omit detailing that here for right now.

Once node and npm are ready, we can install hubot and coffeescript:

    % npm install -g hubot coffeescript
    
This will give us the `hubot` script, which is used for running a hubot, but more importantly to start, generating your own hubot. The name of the new bot is the last argument, and will be created in the directory of the same name. For example, to create a new bot named bender:

    % hubot --create bender

### Deploying

You can deploy hubot to Heroku, which is the officially supported method.
Additionally you are able to deploy hubot to a UNIX-like system or Windows.
Please note the support for deploying to Windows isn't officially supported.

* [Deploying Hubot onto Heroku](deploying/heroku.md)
* [Deploying Hubot onto UNIX](deploying/unix.md)
* [Deploying Hubot onto Windows](deploying/windows.md)
