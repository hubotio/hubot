# Hubot

## Getting Started With Hubot

You will need [node.js](nodejs.org/) and [npm](https://npmjs.org/). Joyent has
an [excellent blog post on how to get those installed](http://joyent.com/blog/installing-node-and-npm), so we'll omit those details here.

Once node and npm are ready, we can install hubot and coffeescript:

    % npm install -g hubot coffee-script

This will give us the `hubot` command, which is used for running a hubot, and more importantly now, generating your own hubot. The name of the new bot is
the last argument, and will be created in the directory of the same name. For
example, to create a new bot named myhubot:

    % hubot --create myhubot

If you are using git, the generated directory includes a .gitignore, so you can
initialize and add everything:

    % cd myhubot
    % git init
    % git add .
    % git commit -m "Initial commit"

You now have your own functional hubot! There's a `bin/hubot`
command for convenience, to handle installing npm dependencies, loading scripts,
and then launching your hubot.

    % bin/hubot
    Hubot>

This starts hubot using the [shell adapter](adapters/shell.md), which
is mostly useful for development. Make note of  `Hubot>`; this is the name he'll
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
    hubot math me <expression> - Calculate the given expression.
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

You almost definitely will want to change his name to give him some more character. bin/hubot takes a `--name`:

    % bin/hubot --name myhubot
    myhubot>

Your hubot will now respond as `myhubot`. This is
case-insensitive, and can be prefixed with `@` or suffixed with `:`. These are equivalent:

    MYHUBOT help
    myhubot help
    @myhubot help
    myhubot: help

## Scripting

Hubot's power comes through scripting. Read [docs/scripting.md](scripting.md) for the deal on bending hubot to your will using code.

There are many community-contributed scripts available through [hubot-scripts](https://github.com/github/hubot-scripts). To use scripts from it:

* Make sure `hubot-scripts` is listed as a dependency in `package.json` (it should by default)
* Update `hubot-scripts.json` to include the script you want in the list. Make sure the file is still valid JSON!
* Review the script to see if there's dependencies or configuration to add

In addition, there are scripts released as npm packages. If you find one you want to use:

1. Add the package to the list of `dependencies` into your `package.json`
2. `npm install` to make sure its installed

**Please note that external scripts may become the default for hubot scripts in future releases.**

## Adapters

Hubot uses the adapter pattern to support multiple chat-backends. Read available adapters in [docs/adapters.md](adapters.md), along with how to configure them.

## Deploying

You can deploy hubot to Heroku, which is the officially supported method.
Additionally you are able to deploy hubot to a UNIX-like system or Windows.
Please note the support for deploying to Windows isn't officially supported.

* [Deploying Hubot onto Heroku](deploying/heroku.md)
* [Deploying Hubot onto UNIX](deploying/unix.md)
* [Deploying Hubot onto Windows](deploying/windows.md)

## Patterns

Using custom scripts, you can quickly customize Hubot to be the most life embettering robot he can be. Read [docs/patterns.md](patterns.md) for some nifty tricks that may come in handy as you teach him new skills.
