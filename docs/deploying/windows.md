# Deploying Hubot to Windows

Hasn't been fully tested - YMMV

There are 3 primary things to deploying and running hubot:

  * node and npm
  * a way to get source code updated on the server
  * a way to start hubot, start it up if it crashes, and restart it when code
    updates

## node and npm

To start, your windows server will need node and npm. 
The best way to do this is with [chocolatey](http://chocolatey.org) using the [nodejs.install](http://chocolatey.org/packages/nodejs.install) package.
I've found that sometimes the system path variable is not correctly set; ensure you can run node/npm from the command line. If needed set the PATH variable with "setx PATH \"%PATH%;C:\Program Files\nodejs\" "

## Updating code on the server

The simplest way to update your hubot's code is going to be to have a git
checkout of your hubot's source code (that you've created during [Getting Started](../README.md), not the [github/hubot repository](http://github.com/github/hubot), and just git pull to get change. This may
feel a dirty hack, but it works when you are starting out.

## Starting, stopping, and restarting hubot

Every hubot install has a `bin/hubot` script to handle starting up the hubot.
You can run this command from your git checkout on the server, but there are some problems you can encounter:

* you disconnect, and hubot dies
* hubot dies, for any reason, and doesn't start again
* it doesn't start up at boot automatically

## Expanding the documentation

Not yet fleshed out. [Help contribute by submitting a pull request, please?](https://github.com/github/hubot/pull/new/master)