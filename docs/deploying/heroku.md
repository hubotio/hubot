---
permalink: /docs/deploying/heroku/index.html
layout: docs
---

If you've been following along with [Getting Started](../index.md), it's time to deploy so you can use it beyond just your local machine.
[Heroku](http://www.heroku.com/) is an easy and supported way to deploy hubot.

Install the [Heroku Toolbelt](https://toolbelt.heroku.com/) to start, then follow their 'Getting Started' instructions, including logging in the first time:

    % heroku login
    Enter your Heroku credentials.
    Email: youremail@example.com
    Password:
    Could not find an existing public key.
    Would you like to generate one? [Yn]
    Generating new SSH public key.
    Uploading ssh public key /Users/you/.ssh/id_rsa.pub

Inside your new hubot directory, make sure you've created a git repository, and that your work is committed:

    % git init
    % git add .
    % git commit -m "Initial commit"

Then create a Heroku application:

    % heroku create
    Creating rosemary-britches-123... done, stack is cedar
    http://rosemary-britches-123.herokuapp.com/ | git@heroku.com:rosemary-britches-123.git
    Git remote heroku added

Before you deploy the application, you'll need to configure some environment
variables for hubot to use. The specific variables you'll need depends on which
[adapter](/docs/adapters.md) and scripts you are using. For Campfire, with no other
scripts, you'd need to set the following environment variables:

    % heroku config:set HUBOT_CAMPFIRE_ACCOUNT=yourcampfireaccount
    % heroku config:set HUBOT_CAMPFIRE_TOKEN=yourcampfiretoken
    % heroku config:set HUBOT_CAMPFIRE_ROOMS=comma,separated,list,of,rooms,to,join

At this point, you are ready to deploy and start chatting. With Heroku, that's a
git push away:

    % git push heroku master

You'll see some text flying, and eventually some success. You should be able to
see your bot in your configured chat rooms at this point. If not, you can peek
at the logs to try to debug:

    % heroku logs

If you make any changes to your hubot, just commit and push them as
before:

    % git commit -am "Awesome scripts OMG"
    % git push heroku master

Some scripts needs Redis to work, Heroku offers an addon called [Redis Cloud](https://addons.heroku.com/rediscloud), which has a free plan. To use it:

    % heroku addons:add rediscloud

Free dynos on Heroku will [sleep after 30 minutes of inactivity](https://devcenter.heroku.com/articles/dyno-sleeping). That means your hubot would leave the chat room and only rejoin when it does get traffic. This is extremely inconvenient since most interaction is done through chat, and hubot has to be online and in the room to respond to messages. To get around this, you can use the [hubot-heroku-keepalive](https://github.com/hubot-scripts/hubot-heroku-keepalive) script, which will keep your free dyno alive for up to 18 hours/day. If you never want Hubot to sleep, you will need to [upgrade to Heroku's hobby plan](https://www.heroku.com/pricing).
