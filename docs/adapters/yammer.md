[Yammer](https://yammer.com) is a social network site for companies.

You should report any issues or submit any pull requests to the
[Yammer adapter](https://github.com/athieriot/hubot-yammer) repository.

## Getting Started

You will also need to edit the `package.json` for your hubot and add the
`hubot-yammer` adapter dependency.

    "dependencies": {
      "hubot-yammer": ">= 0.0.1",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a yammer`. Or if you're deploying locally
you will need to use `-a yammer` when running your hubot.

## Configuring the Adapter

The Yammer adapter requires only the following environment variables.

* `HUBOT_YAMMER_KEY`
* `HUBOT_YAMMER_SECRET`
* `HUBOT_YAMMER_TOKEN`
* `HUBOT_YAMMER_TOKEN_SECRET`

This one is optional but you may want to personalized it.

* `HUBOT_YAMMER_GROUPS` (Which take a list of group names separated by commas)

## Yammer related configuration

* Create a new account for your bot in your Yammer domain
* Create a new application for hubot (see bellow)
* You'll need to create at least one group in wich hubot will talk. By default, this group is "hubot" but you can change him

## Step-by-steps

An easy way to get your access codes is to use [nyam](https://github.com/csanz/node-nyam).

Nyam is a node.js CLI tool wich can help you to setup Yammer authorizations.

First, log on to Yammer and get your own application keys.

    https://www.yammer.com/<DOMAIN>/client_applications/new

Install nyam

    npm install nyam -g

__Warning__: Actually, nyam needs a 0.4.x version of node.js. You may want to look at [nvm](https://github.com/creationix/nvm)

To override nyam configuration with your own app keys create the following file:

    ~/.nyam_keys

and add the following

    {
        "app_consumer_key": "<CONSUMER KEY HERE>",
        "app_consumer_secret": "<CONSUMER SECRET HERE>"
    }

Then, start the setup process to give hubot-yammer access to an account 

    nyam -s

Finally, run nyam with a verbose level to display all the informations you need

    nyam --verbose

### Configuring the variables on Heroku

    % heroku config:add HUBOT_YAMMER_KEY="..."

    % heroku config:add HUBOT_YAMMER_SECRET="..."

    % heroku config:add HUBOT_YAMMER_TOKEN="..."

    % heroku config:add HUBOT_YAMMER_TOKEN_SECRET="..."

    % heroku config:add HUBOT_YAMMER_GROUPS="..."

### Configuring the variables on UNIX

    % export HUBOT_YAMMER_KEY="..."

    % export HUBOT_YAMMER_SECRET="..."

    % export HUBOT_YAMMER_TOKEN="..."

    % export HUBOT_YAMMER_TOKEN_SECRET="..."

    % export HUBOT_YAMMER_GROUPS="..."
