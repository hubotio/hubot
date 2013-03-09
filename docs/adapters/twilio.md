[Twilio](http://www.twilio.com/) is a cloud communication platform for building
telephony application.

You should report any issues or submit any pull requests to the
[Twilio adapter](https://github.com/egparedes/hubot-twilio) repository.

## Getting Started

First you will need to edit the `package.json` for your hubot and add the
`hubot-twilio` adapter dependency.

    "dependencies": {
      "hubot-twilio": ">= 0.0.1",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

You will also need to change the process type in the `Procfile` from `app`
to `web` as Heroku requires this for a HTTP server to listen for requests.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a twilio`. Or if you're deploying locally
you will need to use `-a twilio` when running your hubot.

Once you've deployed your hubot you will need to go back to Twilio and add
the hostname and port of the HTTP endpoint to Twilio so Twilio can send
HTTP requests to your Hubot when it receives SMS.

## Configuring the Adapter

The Twilio adapter requires only the following environment variables.

* `HUBOT_SMS_FROM`
* `HUBOT_SMS_SID`
* `HUBOT_SMS_TOKEN`

### Twilio SMS From

This is the number you want to send and receive SMS from for the hubot. Make
a note of the number including the + and no space.

### Twilio SMS SID

This is the accounts secret SID. Make a note of it.

### Twilio SMS Token

This is the API token. Make a note of it.

### Configuring the variables on Heroku

    % heroku config:add HUBOT_SMS_FROM="..."

    % heroku config:add HUBOT_SMS_SID="..."

    % heroku config:add HUBOT_SMS_TOKEN="..."

### Configuring the variables on UNIX

    % export HUBOT_SMS_FROM="..."

    % export HUBOT_SMS_SID="..."

    % export HUBOT_SMS_TOKEN="..."

### Configuring the variables on Windows

Coming soon!
