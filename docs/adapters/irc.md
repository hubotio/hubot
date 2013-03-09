IRC is a fairly old protocol for Internet chat.

You should report any issues or submit any pull requests to the
[IRC adapter](https://github.com/nandub/hubot-irc) repository.

## Getting Started

First you will need to edit the `package.json` for your hubot and add the
`hubot-irc` adapter dependency.

    "dependencies": {
      "hubot-irc": ">= 0.0.1",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a irc`. Or if you're deploying locally
you will need to use `-a irc` when running your hubot.

## Configuring the Adapter

The IRC adapter requires only the following environment variables.

* `HUBOT_IRC_SERVER`
* `HUBOT_IRC_ROOMS`
* `HUBOT_IRC_NICK`

And the following are optional.

* `HUBOT_IRC_PORT`
* `HUBOT_IRC_PASSWORD`
* `HUBOT_IRC_NICKSERV_PASSWORD`
* `HUBOT_IRC_NICKSERV_USERNAME`
* `HUBOT_IRC_SERVER_FAKE_SSL`
* `HUBOT_IRC_UNFLOOD`
* `HUBOT_IRC_DEBUG`
* `HUBOT_IRC_USESSL`

### IRC Server

This is the full hostname or IP address of the IRC server you want your hubot
to connect to. Make a note of it.

### IRC Rooms

This is a comma separated list of the IRC channels you want your hubot to join.
They must include the `#`. Make a note of them.

### IRC Nick

This is the optional nick you want your hubot to join with. If omitted it will
default to the name of your hubot.

### IRC Port

This is the optional port of the IRC server you want your hubot to connect to.
If omitted the default is `6667`. Make a note of it if required.

### IRC Password

This is the optional password of the IRC server you want your hubot to connect
to. If the IRC server doesn't require a password, this can be omitted. Make a
note of it if required.

### IRC Nickserv Password

This is the optional Nickserv password if your hubot is using a nick registered
with Nickserv on the IRC server. Make a note of it if required.

### IRC Nickserv Username

This is the optional Nickserv username if your hubot is using a nick registered
with Nickserv on the IRC server, e.g. `/msg NickServ identify <username> <password>`.

### IRC Server Fake SSL

This is the optional flag if you want to accept self signed SSL certificated
from a non trusted CA. You can set the variable to anything.

### IRC Unflood

This is the optional flag if you want to protect your hubot from flooding
channels with messages. It will queue messages and slowly send. You can set the
variable to anything.

### IRC Debug

This is the optional flag which will display debug output. You can set the
variable to anything.

### IRC Use SSL

This is the optional flag if your hubot is connecting to an IRC server using
SSL. You can set the variable to anything.

### Configuring the variables on Heroku

    % heroku config:add HUBOT_IRC_SERVER="..."

    % heroku config:add HUBOT_IRC_ROOMS="#foo,#bar"

Optional

    % heroku config:add HUBOT_IRC_NICK="..."

    % heroku config:add HUBOT_IRC_PORT=6767

    % heroku config:add HUBOT_IRC_PASSWORD="..."

    % heroku config:add HUBOT_IRC_NICKSERV_PASSWORD="..."

    % heroku config:add HUBOT_IRC_SERVER_FAKE_SSL="true"

    % heroku config:add HUBOT_IRC_UNFLOOD="true"

    % heroku config:add HUBOT_IRC_DEBUG="true"

    % heroku config:add HUBOT_IRC_USESSL="true"

### Configuring the variables on UNIX

    % export HUBOT_IRC_SERVER="..."

    % export HUBOT_IRC_ROOMS="#foo,#bar"

Optional

    % export HUBOT_IRC_NICK="..."

    % export HUBOT_IRC_PORT=6767

    % export HUBOT_IRC_PASSWORD="..."

    % export HUBOT_IRC_NICKSERV_PASSWORD="..."

    % export HUBOT_IRC_SERVER_FAKE_SSL="true"

    % export HUBOT_IRC_UNFLOOD="true"

    % export HUBOT_IRC_DEBUG="true"

    % export HUBOT_IRC_USESSL="true"

### Configuring the variables on Windows

From Powershell:

    setx HUBOT_IRC_SERVER "..." /m

    setx HUBOT_IRC_ROOMS "#foo,#bar" /m
