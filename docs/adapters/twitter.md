[Twitter](https://twitter.com) is a social network site.

You should report any issues or submit any pull requests to the
[Twitter adapter](https://github.com/mathildelemee/hubot-twitter) repository.

## Getting Started

You will also need to edit the `package.json` for your hubot and add the
`hubot-twitter` adapter dependency.

    "dependencies": {
      "hubot-twitter": ">= 2.0.4",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a twitter`. Or if you're deploying locally
you will need to use `-a twitter` when running your hubot.

## Configuring the Adapter

The Twitter adapter requires only the following environment variables.

* `HUBOT_TWITTER_KEY`
* `HUBOT_TWITTER_SECRET`
* `HUBOT_TWITTER_TOKEN`
* `HUBOT_TWITTER_TOKEN_SECRET`

### Twitter Key

You will need to give your app read and write permissions.

This is the consumer key you get after creating a new application at
[https://dev.twitter.com](https://dev.twitter.com). Make a note of it.

### Twitter Secret

You will need to give your app read and write permissions.

This is the consumer secret you get after creating a new application at
[https://dev.twitter.com](https://dev.twitter.com). Make a note of it.

### Twitter Token

This is the access token you get after generating the access token and token
secret as the user you created the app under. Make a note of it.

### Twitter Token Secret

This is the access token secret you get after generating the access token and
token secret as the user you created the app under. Make a note of it.

### Configuring the variables on Heroku

    % heroku config:add HUBOT_TWITTER_KEY="..."

    % heroku config:add HUBOT_TWITTER_SECRET="..."

    % heroku config:add HUBOT_TWITTER_TOKEN="..."

    % heroku config:add HUBOT_TWITTER_TOKEN_SECRET="..."

### Configuring the variables on UNIX

    % export HUBOT_TWITTER_KEY="..."

    % export HUBOT_TWITTER_SECRET="..."

    % export HUBOT_TWITTER_TOKEN="..."

    % export HUBOT_TWITTER_TOKEN_SECRET="..."

### Configuring the variables on Windows

Using PowerShell for the current session

    % Set-Item -path env:HUBOT_TWITTER_KEY -value ("...")

    % Set-Item -path env:HUBOT_TWITTER_SECRET -value ("...")

    % Set-Item -path env:HUBOT_TWITTER_TOKEN -value ("...")

    % Set-Item -path env:HUBOT_TWITTER_TOKEN_SECRET -value ("...")

Using the Command Prompt for the current session

    % SET HUBOT_TWITTER_KEY="..."

    % SET HUBOT_TWITTER_SECRET="..."
etc.

To set them permanently, right click on `Computer` in Explorer, then click `Properties`, `Advanced System Settings` and then the `Environment Variables` button in the lower right corner.

_Alternatively_, use a command line program like [SETX](http://technet.microsoft.com/en-us/library/cc755104(v=ws.10).aspx), which can also be run remotely. SETX has the ability to remotely set environment variables too. This method has been tested on Windows 8 Pro RTM.
