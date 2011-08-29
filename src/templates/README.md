Hubot
=====

This is a version of GitHub's Campfire bot, hubot.  He's pretty cool.

This version is designed to be deployed on heroku.

Deployment
==========

    % heroku create --stack cedar
    % git push heroku master
    % heroku ps:scale web=1

Hubot needs four environmental variables set to run and to keep him
running on heroku.

Campfire Variables
------------------

Create a separate user for your bot and get their token from the web UI.

    % heroku config:add HUBOT_CAMPFIRE_TOKEN="..."

Get the numeric ids of the rooms you want the bot to join, comma
delimited.

    % heroku config:add HUBOT_CAMPFIRE_ROOMS="42,1024"

Add the subdomain hubot should connect to. If you web URL looks like
`http://mysubdomain.campfirenow.com` then you'd add it like this.

    % heroku config:add HUBOT_CAMPFIRE_ACCOUNT="mysubdomain"

The Web Host
------------
In order to keep hubot running, he needs to trick heroku into thinking
he's constantly getting web traffic.  Hubot will automatically ping his
HTTP endpoint if you set the `HUBOT_WEB_HOST` variable.  You can get the
web endpoint by running `heroku info` and getting the hostname from the
Web URL.  Be sure to remove the `http://` prefix from it.

    % heroku config:add HUBOT_WEB_HOST="galaxy324.herokuapp.com"

Restart the bot
---------------
You may want to get comfortable with `heroku logs` and `heroku restart`
if you're having issues.

Adding Your Own
===============

Take a look at the example scripts in the hubot codebase for now.  He'll
load any scripts you write that are in the `scripts/` folder.
