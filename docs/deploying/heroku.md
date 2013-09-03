# Deploying Hubot to Heroku

If you've been following along with [Getting Started](../README.md), it's time to deploy so you can use it beyond just your local machine.
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
[adapter](../adapters.md) and scripts you are using. For Campfire, with no other
scripts, you'd need to set the following environment variables:

    % heroku config:add HUBOT_CAMPFIRE_ACCOUNT=yourcampfireaccount
    % heroku config:add HUBOT_CAMPFIRE_TOKEN=yourcampfiretoken
    % heroku config:add HUBOT_CAMPFIRE_ROOMS=comma,separated,list,of,rooms,to,join

In addition, there is one special environment variable for Heroku. The default hubot
[Procfile](https://devcenter.heroku.com/articles/procfile) marks the process as
a 'web' process type, in order to support serving http requests (more on that
in the [scripting docs](../scripting.md)). The downside of this is that dynos
will [idle after an hour of inactivity](https://devcenter.heroku.com/articles/dynos#dyno-idling).
That means your hubot would leave after an hour of idle web traffic, and only rejoin when it does get traffic. This is extremely
inconvenient since most interaction is done through chat, and hubot has to be online and in the room to respond to messages. To get around this,
there's a special environment variable to make hubot regularly ping itself over http. If
the app is deployed to http://rosemary-britches-123.herokuapp.com/, you'd
configure:

    % heroku config:add HEROKU_URL=http://rosemary-britches-123.herokuapp.com

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
    
Some scripts needs Redis to work, Heroku offers an addon called [RedisToGo](https://addons.heroku.com/RedisToGo), which has a free nano plan. To use it:

    % heroku addons:add redistogo:nano
