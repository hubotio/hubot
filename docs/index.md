---
title: Hubot
permalink: /docs/index.html
layout: docs
---

## Getting Started With Hubot

You will need [node.js](http://nodejs.org/) and [npm](https://npmjs.org/). Joyent has
an [excellent blog post on how to get those installed](http://joyent.com/blog/installing-node-and-npm), so we'll omit those details here.

Once node and npm are ready, we can install the hubot generator:

    %  npm install -g yo generator-hubot

This will give us the `hubot` [yeoman](http://yeoman.io/) generator. Now we
can make a new directory, and generate a new instance of hubot in it. For example, if
we wanted to make a bot called myhubot:


    % mkdir myhubot
    % cd myhubot
    % yo hubot

At this point, you'll be asked a few questions about who is creating the bot,
and which [adapter](/docs/adapters/) you'll be using. Adapters are hubot's way of
integrating with different chat providers.

If you are using git, the generated directory includes a .gitignore, so you can
initialize and add everything:

    % git init
    % git add .
    % git commit -m "Initial commit"

If you'd prefer to automate your hubot build without being interactively
prompted for its configuration, you can add the following options
to the `yo hubot` command to do so:

| Option                                      | Description
| ------------------------------------------- | -----------------------------------------------------
| `--owner="Bot Wrangler <bw@example.com>"`   | Bot owner, e.g. "Bot Wrangler <bw@example.com>"
| `--name="Hubot"`                            | Bot name, e.g. "Hubot"
| `--description="Delightfully aware robutt"` | Bot description, e.g. "Delightfully aware robutt"
| `--adapter=campfire`                        | Bot adapter, e.g. "campfire"
| `--defaults`                                | Declare all defaults are set and no prompting required

You now have your own functional hubot! There's a `bin/hubot`
command for convenience, to handle installing npm dependencies, loading scripts,
and then launching your hubot.

Hubot needs Redis to persist data, so before you can start hubot on your own computer, you should have Redis installed on your localhost. If just want to test Hubot without Redis, then you can remove `redis-brain.coffee` from `hubot-scripts.json`.

    % bin/hubot
    Hubot>

This starts hubot using the [shell adapter](/docs/adapters/shell/), which
is mostly useful for development. Make note of  `Hubot>`; this is the name your hubot will
`respond` to with commands. For example, to list available commands:

    % bin/hubot
    Hubot> hubot: help
    hubot <keyword> tweet - Returns a link to a tweet about <keyword>
    hubot <user> is a badass guitarist - assign a role to a user
    hubot <user> is not a badass guitarist - remove a role from a user
    hubot animate me <query> - The same thing as `image me`, except adds a few parameters to try to return an animated GIF instead.
    hubot convert me <expression> to <units> - Convert expression to given units.
    hubot die - End hubot process
    hubot echo <text> - Reply back with <text>
    hubot fake event <event> - Triggers the <event> event for debugging reasons
    hubot help - Displays all of the help commands that Hubot knows about.
    hubot help <query> - Displays all help commands that match <query>.
    hubot image me <query> - The Original. Queries Google Images for <query> and returns a random top result.
    hubot map me <query> - Returns a map view of the area returned by `query`.
    hubot mustache me <query> - Searches Google Images for the specified query and mustaches it.
    hubot mustache me <url> - Adds a mustache to the specified URL.
    hubot ping - Reply with pong
    hubot show storage - Display the contents that are persisted in the brain
    hubot show users - Display all users that hubot knows about
    hubot the rules - Make sure hubot still knows the rules.
    hubot time - Reply with current time
    hubot translate me <phrase> - Searches for a translation for the <phrase> and then prints that bad boy out.
    hubot translate me from <source> into <target> <phrase> - Translates <phrase> from <source> into <target>. Both <source> and <target> are optional
    hubot who is <user> - see what roles a user has
    hubot youtube me <query> - Searches YouTube for the query and returns the video embed link.
    hubot pug bomb N - get N pugs
    hubot pug me - Receive a pug
    hubot ship it - Display a motivation squirrel

You almost definitely will want to change your hubot's name to add character. bin/hubot takes a `--name`:

    % bin/hubot --name myhubot
    myhubot>

Your hubot will now respond as `myhubot`. This is
case-insensitive, and can be prefixed with `@` or suffixed with `:`. These are equivalent:

    MYHUBOT help
    myhubot help
    @myhubot help
    myhubot: help

## Scripting

Hubot's power comes through scripting. Read [more about scripting](/docs/scripting.md) for the deal on bending hubot to your will using code.

There are many community-contributed scripts available through [hubot-scripts](https://github.com/github/hubot-scripts). To use scripts from it:

* Make sure `hubot-scripts` is listed as a dependency in `package.json` (it should by default)
* Update `hubot-scripts.json` to include the script you want in the list. Make sure the file is still valid JSON!
* Review the script to see if there's dependencies or configuration to add

In addition, there are scripts released as npm packages. If you find one you want to use:

1. Add the package to the list of `dependencies` into your `package.json`
2. `npm install` to make sure its installed

To enable third-party scripts that you've added you will need to add the package
name as a double quoted string to the `external-scripts.json` file in this repo.

**Please note that external scripts may become the default for hubot scripts in future releases.**

## Adapters

Hubot uses the adapter pattern to support multiple chat-backends. Here is a [list of available adapters](/docs/adapters/), along with details on how to configure them.

## Deploying

You can deploy hubot to Heroku, which is the officially supported method.
Additionally you are able to deploy hubot to a UNIX-like system or Windows.
Please note the support for deploying to Windows isn't officially supported.

* [Deploying Hubot onto Heroku](/docs/deploying/heroku/)
* [Deploying Hubot onto UNIX](/docs/deploying/unix/)
* [Deploying Hubot onto Windows](/docs/deploying/windows/)

## Patterns

Using custom scripts, you can quickly customize Hubot to be the most life embettering robot he or she can be. Read [docs/patterns.md](/docs/patterns/) for some nifty tricks that may come in handy as you teach your hubot new skills.
