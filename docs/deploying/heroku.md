# Deploying Hubot to Heroku

Once you have [gotten started](../deploying.md) with Hubot, it's time to deploy
so you can use it outside of your local machine.
[Heroku](http://www.heroku.com/) is an easy and supported way to deploy hubot.

To start, install the [Heroku Toolbelt](https://toolbelt.heroku.com/) if you
haven't already. Follow their `Getting Started' instructions, including logging
in:

    % heroku login
    Enter your Heroku credentials.
    Email: josh@technicalpickles.com
    Password:
    Could not find an existing public key.
    Would you like to generate one? [Yn]
    Generating new SSH public key.
    Uploading ssh public key /Users/technicalpickles/.ssh/id_rsa.pub

Inside your new hubot instance, you'll need to create a Heroku application for
it. Make sure it is a git repository first and commit anything you've done so
far, then you can create the app:

    % heroku create
    Creating stark-fog-398... done, stack is cedar
    http://stark-fog-398.herokuapp.com/ | git@heroku.com:stark-fog-398.git
    Git remote heroku added

Before you deploy the application, you'll need to configure some environment
variables for hubot to use. The variables you need depends on which
[adapter](../adapters.md) and scripts you are using. For Campfire, with no other
scripts, you'd need to at least:

  % heroku config:add HUBOT_CAMPFIRE_ACCOUNT=yourcampfireaccount
  % heroku config:add HUBOT_CAMPFIRE_TOKEN=yourcampfiretoken
  % heroku config:add HUBOT_CAMPFIRE_ROOMS=comma,separated,list,of,rooms,to,join

In addition is one special environment variable for Heroku. The default hubot
[Procfile](https://devcenter.heroku.com/articles/procfile) marks the process as
a 'web' process type, in order to support serving up http requests (more on that
in the [scripting docs](../scripting.md). The downside of this is that dynos
will [idle after an hour of inactivity](https://devcenter.heroku.com/articles/dynos#dyno-idling).
That means your hubot would leave after an hour, assuming you don't hit the web
interface, and only rejoin when it does get traffic. This is extremely
inconvenient, since most interaction is done through chat. To mitigate this,
there's a special environment variable to make hubot regularly ping itself. If
the app is deployed to http://stark-fog-398.herokuapp.com/, then you'd
configure:

    % heroku config:add HUBOT_HEROKU_URL=http://stark-fog-398.herokuapp.com

At this point, you are ready to deploy and start chatting. With Heroku, that's a
git push away:

    % git push heroku master

You'll see some text flying, and eventually some success. You should be able to
see your bot in your configured chat rooms at this point. If not, you can peek
at the logs to try to debug:

    % heroku logs

If you make any changes to your hubot, just commit them, and push them as
before:

  % git ci -a -m "Awesome scripts OMG"
  % git push heroku master
