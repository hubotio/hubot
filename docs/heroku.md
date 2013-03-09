# Deploying Hubot onto Heroku

Deploying hubot to Heroku is simple once you understand the process. This page is
going to give you a step by step guide to deploying hubot onto Heroku.

This guide is going to assume that you are deploying a hubot with the Campfire
adapter. You can use the other adapters instead of the Campfire adapter. Check
out the wiki pages for the other adapters for configuration options.

## Requirements

You should have the following installed and setup.

* [Git](http://git-scm.com/download)
* [Ruby](http://www.ruby-lang.org/en/)
* [Heroku Gem](http://devcenter.heroku.com/articles/heroku-command)
* [Node](http://nodejs.org/download/)

### Get the Latest Version of Hubot

1. Download the latest version from https://github.com/github/hubot/archive/master.zip
2. Extract the downloaded archive
3. Open a terminal to the extracted directory, and do this:

```sh
% npm install
% make package
% cd hubot
```

This will generate a
packaged version of Hubot which is designed to be deployed to Heroku.

## Creating the Git Repository

Before you deploy to Heroku you will need to create a git repository in the
directory which was extracted from the hubot download.

Initialize the directory as a git repository.

    % git init

Add all the files in the directory to the git repository.

    % git add .

Commit the added file to the git repository.

    % git commit -m "Initial commit"

If everything went ok, you should see the "Initial commit" when you check the
log of the repository you should see your new commit.

    % git log

    commit 1324573424f1feee2310d7e808194a247b44fc16
    Author: Tom Bell <tomb@tomb.io>
    Date:   Sun Dec 4 17:38:27 2011 -0500

        Initial commit

## Creating the Heroku Application

You should have the `heroku` command available if you've installed the heroku
gem correctly. You can read the
[Heroku help](http://devcenter.heroku.com/articles/heroku-command) for
configuring the gem once it's installed.

Create a new Heroku application.

    % heroku create

This should add a remote to the git repository called `heroku`, push the
git repository to Heroku. (Please note that Heroku expects your code to be
on the "master" branch.)

    % git push heroku master

If you want to use the `redis-brain.coffee` you will need to add the Redis to
Go addon (this requires a verified account).

    % heroku addons:add redistogo:nano

Please note that the `nano` plan does not include persistence. Your data will
_NOT_ be retained between restarts of hubot.

## Configuring the Heroku Application

Hubot requires environment variables to be configured to connect to the service
that your chosen adapter is for. The process of adding and changing variables
is the same no matter which adapter you are using. We're going to configure the
variables needed to connect to Campfire.

You will need to create a new Campfire account for you hubot to connect with.
You will need three pieces of information before continuing.

You will need to set a configuration variable if you are hosting on the free
Heroku plan.

    % heroku config:add HEROKU_URL=http://soothing-mists-4567.herokuapp.com

Where the URL is your Heroku app's URL.

### Campfire API Token

This can be found by logging in with your hubot's account click the **My Info**
link and make a note of the API token.

Then you can add the environment variable.

    % heroku config:add HUBOT_CAMPFIRE_TOKEN="..."

### Campfire Room IDs

If you join the rooms you want your hubot to join will see notice a numerical
ID for the room in the URL. Make a note of each ID for the rooms you want your
hubot to join.

Then you can add the room IDs are a comma separate list.

    % heroku config:add HUBOT_CAMPFIRE_ROOMS="123,321"

### Campfire Subdomain

This is simply the first part of the domain you visit for your Campfire
account. For example if your Campfire was at `hubot.campfirenow.com` your
subdomain is `hubot`. Make a note of the subdomain.

Then you can add the subdomain environment variable.

    % heroku config:add HUBOT_CAMPFIRE_ACCOUNT="..."

### Other Adapters

You can visit the [hubot wiki](https://github.com/github/hubot/wiki) to find
the wiki pages of the other available adapters an instructions for configuring
those for deployment.

## Running the Heroku Application

The final step of deploying is getting the application running. We need to
scale the process we have told Heroku to run.

    % heroku ps:scale web=1

This will tell Heroku to run 1 of the `web` process type which is described in
the `Procfile`.

## Debugging Issues

If you come across any issues with the running of your hubot deployed to Heroku
you will first can to check the logs.

    % heroku logs

This should give any indication of trivial errors such as missing environment
variables which haven't been configured.

You should also become familiar with restarting the application as well.

    % heroku restart

You can also check the configured environment variables with the following
command.

    % heroku config
