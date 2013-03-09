[Flowdock](https://www.flowdock.com/) is a web based collabration and chat app. It integrates nicely with GitHub, Pivotal Tracker, Twitter, JIRA, Confluence, most CI systems and even email.

You should report any issues or submit any pull requests to the
[Flowdock adapter](https://github.com/flowdock/hubot-flowdock) repository.

## Getting Started

First you will need to edit the `package.json` for your hubot and add the
`hubot-flowdock` adapter dependency.

    "dependencies": {
      "hubot-flowdock": ">= 0.0.1",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a flowdock`. Or if you're deploying locally
you will need to use `-a flowdock` when running your hubot.

## Configuring the Adapter

The Flowdock adapter requires only the following environment variables.

    HUBOT_FLOWDOCK_LOGIN_EMAIL
    HUBOT_FLOWDOCK_LOGIN_PASSWORD
    
    # Heroku specific: to enable the keep-alive functionality for Hubot > 2.1.4.
    # More info at https://github.com/github/hubot/pull/270.
    HEROKU_HOSTNAME

### Flowdock Login Email

This is the email address of the account which your hubot will be using. Make
a note of it.

### Flowdock Login Password

This is the password of the account which your hubot will be using. Make a note
of it.

### Heroku Hostname

Your Hubot instance's hostname in Heroku.

### Configuring the variables on Heroku

    % heroku config:add HUBOT_FLOWDOCK_LOGIN_EMAIL="..."

    % heroku config:add HUBOT_FLOWDOCK_LOGIN_PASSWORD="..."

### Configuring the variables on UNIX

    % export HUBOT_FLOWDOCK_LOGIN_EMAIL="..."

    % export HUBOT_FLOWDOCK_LOGIN_PASSWORD="..."

### Configuring the variables on Windows

Coming soon!
