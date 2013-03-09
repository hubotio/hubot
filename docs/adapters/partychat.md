[Partychat-hooks](http://partychat-hooks.appspot.com/) is a service for hooking
into [Partychat](http://partychapp.appspot.com/).

You should report any issues or submit any pull requests to the
[Partychat-hooks adapter](https://github.com/iangreenleaf/hubot-partychat-hooks)
repository.

## Getting Started

First you will need to edit the `package.json` for your hubot and add the
`hubot-partychat-hooks` adapter dependency.

    "dependencies": {
      "hubot-partychat-hooks": ">= 0.0.1",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

You will also need to change the process type in the `Procfile` from `app`
to `web` as Heroku requires this for a HTTP server to listen for requests.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a partychat-hooks`. Or if you're deploying locally
you will need to use `-a partychat-hooks` when running your hubot.

## Configuring the Adapter

The Partychat-Hooks adapter requires only the following environment variables.

* `HUBOT_POST_ENDPOINT`

### Partychat-Hooks Post Endpoint

Log into Partychat-Hooks and create a hook for your chat room. Create a new
Post Hook and enter the following as the body.

    {{get_argument("body")}}

Make a note of the HTTP endpoint, you will need this for hubot.

Create a new Receive Hook and enter `*` as the command sequence, and the
address including port that hubot will run on as the HTTP endpoint.

### Configuring the variables on Heroku

    % heroku config:add HUBOT_POST_ENDPOINT="..."

### Configuring the variables on UNIX

    % export HUBOT_POST_ENDPOINT="..."

### Configuring the variables on Windows

Coming soon!
