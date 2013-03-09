[Talker](http://talkerapp.com/) is a fast, intuitive and extensible group chat
web app.

You should report any issues or submit any pull requests to the
[Talker adapter](https://github.com/unixcharles/hubot-talker) repository.

## Getting Started

You will also need to edit the `package.json` for your hubot and add the
`hubot-talker` adapter dependency.

    "dependencies": {
      "hubot-talker": ">= 1.0.1",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a talker`. Or if you're deploying locally
you will need to use `-a talker` when running your hubot.

## Configuring the Adapter

The Talker adapter requires only the following environment variables.

* `HUBOT_TALKER_TOKEN`
* `HUBOT_TALKER_ROOMS`

### Talker Token

This is the Talker API token for the account you created for your hubot. Make
a note of it.

### Talker Rooms

This is a comma separate list of room ids you wish your hubot to join.

You can find the id of a room in the URL.

    https://{domain}.talkerapp.com/rooms/{id}

### Configuring the variables on Heroku

    % heroku config:add HUBOT_TALKER_TOKEN="..."

    % heroku config:add HUBOT_TALKER_ROOMS="111,222"

### Configuring the variables on UNIX

    % export HUBOT_TALKER_TOKEN="..."

    % export HUBOT_TALKER_ROOMS="111,222"

### Configuring the variables on Windows

Coming soon!

