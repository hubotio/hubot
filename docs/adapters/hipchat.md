[HipChat](https://www.hipchat.com/) is a group chat and instant messaging app for teams.

**NOTE:** Please see the [HipChat adapter repository](https://github.com/hipchat/hubot-hipchat) to see the latest setup instructions, report any issues, or submit any pull requests.

## Getting Started

The HipChat adapter requires `node-stringprep` which in turn, requires
`icu-config` to be available in the path. If you're trying to play locally,
then you need to install `icu4c`, which, conveniently, homebrew can take care
of for you

    % brew install icu4c

But `brew` will not link any of the utilities, you'll have to do that by hand
(in particular `icu-config` which is needed for `node-stringprep` to build
correctly (it'll just appear like a broken package otherwise which will be
really disturbing)). You can link it with brew using `brew link icu4c`.

You will also need to edit the `package.json` for your hubot and add the
`hubot-hipchat` adapter dependency.

    "dependencies": {
      "hubot-hipchat": ">= 1.0.2",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

If deploying to Heroku you will need to edit the `Procfile` and change the
`-a campfire` option to `-a hipchat`. Or if you're deploying locally
you will need to use `-a hipchat` when running your hubot.

## Configuring the Adapter

The HipChat adapter requires only the following environment variables.

* `HUBOT_HIPCHAT_TOKEN`
* `HUBOT_HIPCHAT_JID`
* `HUBOT_HIPCHAT_NAME`
* `HUBOT_HIPCHAT_PASSWORD`
* `HUBOT_HIPCHAT_ROOMS`

### HipChat Token

This is the "SHA-soup" that your HipChat admin can generate for your hubot's
HipChat account.

### HipChat JID

This is your hubot's Jabber ID, it can be found in your [XMPP/Jabber account settings](https://webbynode.hipchat.com/account/xmpp) and will look something like
`2313_34124@chat.hipchat.com`.

### HipChat Name

This is the full name exactly as you see it on the HipChat account for your
hubot. For example "Gnomotron Bot".

### HipChat Password

This is the password for your hubot's HipChat account.

### HipChat Rooms

This is a comma separated list of room JIDs that you want your bot to join. You can leave this blank or set it to "@All" to have your bot join every room. Room JIDs look like "123_development@conf.hipchat.com" and can be found in the XMPP/Jabber account settings - just add "@conf.hipchat.com" to the end of the room's "XMPP/Jabber Name".

### Configuring the variables on Heroku

    % heroku config:add HUBOT_HIPCHAT_TOKEN="..."

    % heroku config:add HUBOT_HIPCHAT_JID="..."

    % heroku config:add HUBOT_HIPCHAT_NAME="..."

    % heroku config:add HUBOT_HIPCHAT_PASSWORD="..."

    % heroku config:add HUBOT_HIPCHAT_ROOMS="...,..."

### Configuring the variables on UNIX

    % export HUBOT_HIPCHAT_TOKEN="..."

    % export HUBOT_HIPCHAT_JID="..."

    % export HUBOT_HIPCHAT_NAME="..."

    % export HUBOT_HIPCHAT_PASSWORD="..."

    % export HUBOT_HIPCHAT_ROOMS="...,..."

### Configuring the variables on Windows

Coming soon!
