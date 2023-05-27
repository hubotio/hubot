---
permalink: /docs/
---

## Getting Started With Botfoge

You will need [node.js and npm](https://docs.npmjs.com/getting-started/installing-node). Once those are installed, we can install the botforge generator:

    %  npm install -g yo generator-botforge

This will give us the `botforge` [yeoman](http://yeoman.io/) generator. Now we
can make a new directory, and generate a new instance of botforge in it. For example, if
we wanted to make a bot called mybotforge:


    % mkdir mybotforge
    % cd mybotforge
    % yo hubbotforgeot

At this point, you'll be asked a few questions about who is creating the bot,
and which [adapter](adapters.md) you'll be using. Adapters are botforge's
way of integrating with different chat providers.

If you are using git, the generated directory includes a .gitignore, so you can
initialize and add everything:

    % git init
    % git add .
    % git commit -m "Initial commit"

If you'd prefer to automate your botforge build without being interactively
prompted for its configuration, you can add the following options
to the `yo botforge` command to do so:

| Option                                      | Description                                            |
|:--------------------------------------------|:-------------------------------------------------------|
| `--owner="Bot Wrangler <bw@example.com>"`   | Bot owner, e.g. "Bot Wrangler <bw@example.com>"        |
| `--name="Botforge"`                         | Bot name, e.g. "Botforge"                              |
| `--description="Delightfully aware robutt"` | Bot description, e.g. "Delightfully aware robutt"      |
| `--adapter=campfire`                        | Bot adapter, e.g. "campfire"                           |
| `--defaults`                                | Declare all defaults are set and no prompting required |

You now have your own functional botforge! There's a `bin/botforge`
command for convenience, to handle installing npm dependencies, loading scripts,
and then launching your botforge.

Note: Botforge can use Redis to persist data, so before you can start botforge on your own computer, if you want to persist data, then you should have Redis running on your machine accessible via `localhost`. Then, ensure that `botforge-redis-brain` is listed in `external-scripts.json` as an `Array` of module names (e.g. `['botforge-redis-brain']`) or an `object` where the key is the name of the module (e.g. `{'botforge-redis-brain': 'some arbitrary value'}`) where the value of the property in the object is passed to the module function as the second argument. The first argument being the botforge Robot instance.

    % bin/botforge
    Botforge>

This starts botforge using the [shell adapter](./adapters/shell.md), which is mostly useful for development. Make note of the name in the `botforge>` prompt; this is the name your botforge will respond to with commands. If the prompt reads `mybotforge>` then your commands must start with `mybotforge <command>`.

For example, to list available commands:

    % bin/botforge
    mybotforge> mybotforge help
    mybotforge> Shell: mybotforge adapter - Reply with the adapter
    mybotforge animate me <query> - The same thing as `image me`, except adds a few parameters to try to return an animated GIF instead.
    mybotforge echo <text> - Reply back with <text>
    mybotforge help - Displays all of the help commands that Botforge knows about.
    mybotforge help <query> - Displays all help commands that match <query>.
    mybotforge image me <query> - The Original. Queries Google Images for <query> and returns a random top result.
    mybotforge map me <query> - Returns a map view of the area returned by `query`.
    mybotforge mustache me <url|query> - Adds a mustache to the specified URL or query result.
    mybotforge ping - Reply with pong
    mybotforge pug bomb N - get N pugs
    mybotforge pug me - Receive a pug
    mybotforge the rules - Make sure botforge still knows the rules.
    mybotforge time - Reply with current time
    mybotforge translate me <phrase> - Searches for a translation for the <phrase> and then prints that bad boy out.
    mybotforge translate me from <source> into <target> <phrase> - Translates <phrase> from <source> into <target>. Both <source> and <target> are optional
    ship it - Display a motivation squirrel

You almost definitely will want to change your botforge's name to add character. bin/botforge takes a `--name`:

    % bin/botforge --name sam
    sam>

Your botforge will now respond as `sam`. This is
case-insensitive, and can be prefixed with `@` or suffixed with `:`. These are equivalent:

    SAM help
    sam help
    @sam help
    sam: help

## Scripts

Botforge's power comes through scripts. There are hundreds of scripts written and maintained by the community. Find them by searching the [NPM registry](https://www.npmjs.com/browse/keyword/botforge-scripts) for `botforge-scripts <your-search-term>`. For example:

```
$ npm search botforge-scripts github
NAME                  DESCRIPTION
botforge-deployer        Giving Botforge the ability to deploy GitHub repos to PaaS providers botforge botforge-scripts botforge-gith
botforge-gh-release-pr   A botforge script to create GitHub's PR for release
botforge-github          Giving Botforge the ability to be a vital member of your github organization
…
```

To use a script from an NPM package:

1. Run `npm install --save <package-name>` to add the package as a dependency and install it.
2. Add the package to `external-scripts.json`.
3. Run `npm home <package-name>` to open a browser window for the homepage of the script, where you can find more information about configuring and installing the script.

You can also put your own scripts under the `scripts/` directory. All scripts (files ending with either `.js` or `.mjs`) placed there are automatically loaded and ready to use with your botforge. Read more about customizing botforge by [writing your own scripts](scripting.md).

## Adapters

Botforge uses the adapter pattern to support multiple chat-backends. Here is a [list of available adapters](adapters.md), along with details on how to configure them.

## Deploying

You can deploy botforge to Heroku, which is the officially supported method. Additionally you are able to deploy botforge to a UNIX-like system or Windows. Please note the support for deploying to Windows isn't officially supported.

* [Deploying Bortforge onto Azure](./deploying/azure.md)
* [Deploying Bortforge onto Bluemix](./deploying/bluemix.md)
* [Deploying Bortforge onto Heroku](./deploying/heroku.md)
* [Deploying Bortforge onto Unix](./deploying/unix.md)
* [Deploying Bortforge onto Windows](./deploying/windows.md)

## Patterns

Using custom scripts, you can quickly customize Botforge to be the most life embettering robot he or she can be. Read [docs/patterns.md](patterns.md) for some nifty tricks that may come in handy as you teach your botforge new skills.