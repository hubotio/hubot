[Gtalk](http://talk.google.com) is the Jabber-based instant messaging service
provided by Google.

You should report any issues or submit any pull requests to the
[GTalk adapter](https://github.com/atmos/hubot-gtalk) repository.

## Getting Started

You will also need to edit the `package.json` for your hubot and add the
`hubot-gtalk` adapter dependency.

    "dependencies": {
      "hubot-gtalk": ">= 0.0.1",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a gtalk`. Or if you're deploying locally
you will need to use `-a gtalk` when running your hubot.

## Configuring the Adapter

The GTalk adapter requires only the following environment variables.

* `HUBOT_GTALK_USERNAME` (Should be full email address, e. g. `octodog@gmail.com`)
* `HUBOT_GTALK_PASSWORD`

And the following are optional.

* `HUBOT_GTALK_WHITELIST_DOMAINS`
* `HUBOT_GTALK_WHITELIST_USERS`
* `HUBOT_GTALK_REGEXP_TRANSFORMATIONS`

### GTalk Username

This is the username (email) of the account your hubot will use to connect to
GTalk. Make a note of it.

### GTalk Password

This is the password of the account your hubot will use to connect to GTalk.
Make a note of it.

### GTalk Whitelist Domains

This is an optional comma separated list of domain names that hubot will
automatically accept contact list requests from. Make a note of them if
required.

### GTalk Whitelist Users

This is an optional comma separated list of usernames that hubot will
automatically accept contact list requests from. Make a note of them if
required.

### GTalk RegExp Transformations on Messages

Adds ability to transform messages using regexp. Format is: `regexp|replacement`. Example:

```
HUBOT_GTALK_REGEXP_TRANSFORMATIONS=".?: ?(.)|\$1"
```


### Configuring the variables on Heroku

    % heroku config:add HUBOT_GTALK_USERNAME="..."

    % heroku config:add HUBOT_GTALK_PASSWORD="..."

Optional

    % heroku config:add HUBOT_GTALK_WHITELIST_DOMAINS="...,..."

    % heroku config:add HUBOT_GTALK_WHITELIST_USERS="...,..."

### Configuring the variables on UNIX

    % export HUBOT_GTALK_USERNAME="..."

    % export HUBOT_GTALK_PASSWORD="..."

Optional

    % export HUBOT_GTALK_WHITELIST_DOMAINS="...,..."

    % export HUBOT_GTALK_WHITELIST_USERS="...,..."

### Troubleshooting

#### StringPrep errors

If you see something like this:

```
Cannot load StringPrep-0.1.0 bindings. You may need to `npm install node-stringprep'
```

don’t worry—StringPrep is not required for `hubot-gtalk`.

