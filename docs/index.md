---
permalink: /docs/
---

## Getting Started With Hubot

You will need [node.js and npm](https://docs.npmjs.com/getting-started/installing-node). Once those are installed, we can install the hubot generator:

    %  npm install -g yo generator-hubot

This will give us the `hubot` [yeoman](http://yeoman.io/) generator. Now we
can make a new directory, and generate a new instance of hubot in it. For example, if
we wanted to make a bot called myhubot:


    % mkdir myhubot
    % cd myhubot
    % yo hubot

At this point, you'll be asked a few questions about who is creating the bot,
and which [adapter](adapters.md) you'll be using. Adapters are hubot's
way of integrating with different chat providers.

If you are using git, the generated directory includes a .gitignore, so you can
initialize and add everything:

    % git init
    % git add .
    % git commit -m "Initial commit"

If you'd prefer to automate your hubot build without being interactively
prompted for its configuration, you can add the following options
to the `yo hubot` command to do so:

| Option                                      | Description                                            |
|:--------------------------------------------|:-------------------------------------------------------|
| `--owner="Bot Wrangler <bw@example.com>"`   | Bot owner, e.g. "Bot Wrangler <bw@example.com>"        |
| `--name="Hubot"`                            | Bot name, e.g. "Hubot"                                 |
| `--description="Delightfully aware robutt"` | Bot description, e.g. "Delightfully aware robutt"      |
| `--adapter=campfire`                        | Bot adapter, e.g. "campfire"                           |
| `--defaults`                                | Declare all defaults are set and no prompting required |

You now have your own functional hubot! There's a `bin/hubot`
command for convenience, to handle installing npm dependencies, loading scripts,
and then launching your hubot.

Hubot needs Redis to persist data, so before you can start hubot on your own computer, you should have Redis installed on your localhost. If just want to test Hubot without Redis, then you can remove `hubot-redis-brain` from `external-scripts.json`.

    % bin/hubot
    Hubot>

This starts hubot using the [shell adapter](./adapters/shell.md), which
is mostly useful for development. Make note of the name in the `hubot>` prompt;
this is the name your hubot will respond to with commands. If the prompt
reads `myhubot>` then your commands must start with `myhubot <command>`

For example, to list available commands:

    % bin/hubot
    myhubot> myhubot help
    myhubot> Shell: myhubot adapter - Reply with the adapter
    myhubot animate me <query> - The same thing as `image me`, except adds a few parameters to try to return an animated GIF instead.
    myhubot echo <text> - Reply back with <text>
    myhubot help - Displays all of the help commands that Hubot knows about.
    myhubot help <query> - Displays all help commands that match <query>.
    myhubot image me <query> - The Original. Queries Google Images for <query> and returns a random top result.
    myhubot map me <query> - Returns a map view of the area returned by `query`.
    myhubot mustache me <url|query> - Adds a mustache to the specified URL or query result.
    myhubot ping - Reply with pong
    myhubot pug bomb N - get N pugs
    myhubot pug me - Receive a pug
    myhubot the rules - Make sure hubot still knows the rules.
    myhubot time - Reply with current time
    myhubot translate me <phrase> - Searches for a translation for the <phrase> and then prints that bad boy out.
    myhubot translate me from <source> into <target> <phrase> - Translates <phrase> from <source> into <target>. Both <source> and <target> are optional
    ship it - Display a motivation squirrel

You almost definitely will want to change your hubot's name to add character. bin/hubot takes a `--name`:

    % bin/hubot --name sam
    sam>

Your hubot will now respond as `sam`. This is
case-insensitive, and can be prefixed with `@` or suffixed with `:`. These are equivalent:

    SAM help
    sam help
    @sam help
    sam: help

## Scripts

Hubot's power comes through scripts. There are hundreds of scripts written and maintained by the community. Find them by searching the [NPM registry](https://www.npmjs.com/browse/keyword/hubot-scripts) for `hubot-scripts <your-search-term>`. For example:

```
$ npm search hubot-scripts github
NAME                  DESCRIPTION
hubot-deployer        Giving Hubot the ability to deploy GitHub repos to PaaS providers hubot hubot-scripts hubot-gith
hubot-gh-release-pr   A hubot script to create GitHub's PR for release
hubot-github          Giving Hubot the ability to be a vital member of your github organization
…
```

To use a script from an NPM package:

1. Run `npm install --save <package-name>` to add the package as a dependency and install it.
2. Add the package to `external-scripts.json`.
3. Run `npm home <package-name>` to open a browser window for the homepage of the script, where you can find more information about configuring and installing the script.

You can also put your own scripts under the `scripts/` directory. All scripts placed there are automatically loaded and ready to use with your hubot. Read more about customizing hubot by [writing your own scripts](scripting.md).

## Adapters

Hubot uses the adapter pattern to support multiple chat-backends. Here is a [list of available adapters](adapters.md), along with details on how to configure them.

## Deploying

You can deploy hubot to Heroku, which is the officially supported method.
Additionally you are able to deploy hubot to a UNIX-like system or Windows.
Please note the support for deploying to Windows isn't officially supported.

* [Deploying Hubot onto Azure](./deploying/azure.md)
* [Deploying Hubot onto Bluemix](./deploying/bluemix.md)
* [Deploying Hubot onto Heroku](./deploying/heroku.md)
* [Deploying Hubot onto Unix](./deploying/unix.md)
* [Deploying Hubot onto Windows](./deploying/windows.md)

## Patterns

Using custom scripts, you can quickly customize Hubot to be the most life embettering robot he or she can be. Read [docs/patterns.md](patterns.md) for some nifty tricks that may come in handy as you teach your hubot new skills.
