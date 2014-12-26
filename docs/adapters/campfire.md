# Adapter: Campfire

[Campfire](http://campfirenow.com/) is a web based chat application built by
[37signals](http://37signals.com). The Campfire adapter is one of the original
adapters in Hubot.

## Getting Started

You will need a Campfire account to start, which you can
[sign up for free](https://signup.37signals.com/campfire/free/signup/new).

Next, you will need to create a user on your Campfire account for your Hubot,
then give it access so it can join to your rooms. You will need to create a room
if you haven't already.

Hubot defaults to using its [shell](shell.md), so to use Campfire instead, you
can run hubot with `-a campfire`:

    % bin/hubot -a campfire

If you are deploying to Heroku or using foreman, you need to make
sure the hubot is called with `-a campfire` in the `Procfile`:

    web: bin/hubot -a campfire -n Hubot

## Configuring

The adapter requires the following environment variables.

* `HUBOT_CAMPFIRE_ACCOUNT`
* `HUBOT_CAMPFIRE_TOKEN`
* `HUBOT_CAMPFIRE_ROOMS`

### Campfire API Token

This can be found by logging in with your hubot's account click the **My Info**
link and make a note of the API token.

### Campfire Room IDs

If you join the rooms you want your hubot to join will see notice a numerical
ID for the room in the URL. Make a note of each ID for the rooms you want your
hubot to join.

### Campfire Account

This is simply the first part of the domain you visit for your Campfire
account. For example if your Campfire was at `hubot.campfirenow.com` your
subdomain is `hubot`. Make a note of the subdomain.

### Configuring the variables on Heroku

    % heroku config:set HUBOT_CAMPFIRE_TOKEN="..."

    % heroku config:set HUBOT_CAMPFIRE_ROOMS="123,321"

    % heroku config:set HUBOT_CAMPFIRE_ACCOUNT="..."

### Configuring the variables on UNIX

    % export HUBOT_CAMPFIRE_TOKEN="..."

    % export HUBOT_CAMPFIRE_ROOMS="123,321"

    % export HUBOT_CAMPFIRE_ACCOUNT="..."

### Configuring the variables on Windows

Using PowerShell:

    setx HUBOT_CAMPFIRE_TOKEN "..." /m

    setx HUBOT_CAMPFIRE_ROOMS "123,321" /m 

    setx HUBOT_CAMPFIRE_ACCOUNT "..." /m
