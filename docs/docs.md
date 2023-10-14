---
title: Getting Started With Hubot
layout: layouts/docs.html
published: 2023-10-10T19:25:22.000Z
permalink: /docs.html
---

# Getting Started With Hubot

You will need [node.js and npm](https://docs.npmjs.com/getting-started/installing-node). Once those are installed, you can setup a new codebase for a new Hubot instance with the following shell commands. It will create a new directory called `myhubot` in the current working directory.

```sh
npx hubot --create myhubot
```

Now open `package.json` in your code editor and add a `start` property to the `scripts` property:

```json
{
...
    "scripts": {
        "start": "hubot"
    }
...
}
```

Start your Hubot instance by executing `npm start`. It will start with the built in [shell adapter](/adapters/shell.html), which starts a [REPL](https://en.wikipedia.org/wiki/Read–eval–print_loop) where you can type commands.

Your terminal should look like:

```sh
Hubot>
```

Typing `help` will list some default commands that Hubot's default adapter, Shell, can handle.

```sh
Hubot> help
usage:
history 
exit, \q - close shell and exit
help, \? - print this usage
clear, \c - clear the terminal screen
Hubot>
```

Changing your Hubot instances name will reduce confusion down the road, so set the `--name` argument in the `hubot` command:

```json
{
...
    "scripts": {
        "start": "hubot --name sam"
    }
...
}
```

Your hubot will now respond as `sam`. Note, a common usage pattern is prefixing a command message with Hubot's name. Hubot's code pattern matches on it in order to trigger sending it to Hubot. This is case-insensitive, and can be prefixed with `@` or suffixed with `:`. The following examples result in the message getting sent to Hubot.

```sh
sam> SAM help
sam> sam help
sam> @sam help
sam> sam: help
```

## <a name="scripts">Scripts</a>

Hubot's power comes through scripts. There are hundreds of scripts written and maintained by the community. Find them by searching the [NPM registry](https://www.npmjs.com/browse/keyword/hubot-scripts) for `hubot-scripts <your-search-term>`. For example:

```sh
$ npm search hubot-scripts github
NAME                  DESCRIPTION
hubot-deployer        Giving Hubot the ability to deploy GitHub repos to PaaS providers hubot hubot-scripts hubot-gith
hubot-gh-release-pr   A hubot script to create GitHub's PR for release
hubot-github          Giving Hubot the ability to be a vital member of your github organization
```

To use a script from an NPM package:

1. Run `npm install <package-name>` in the codebase directory to install it.
2. Add the package name to a file called `external-scripts.json`.

```json
["hubot-diagnostics", "hubot-help"]
```

3. Run `npm home <package-name>` to open a browser window for the homepage of the script, where you can find more information about configuring and installing the script.

You can also create your own scripts and save them in a folder called `./scripts/` (`./` means current working directory) in your codebase directory. All scripts (files ending with `.js` and `.mjs`) placed there are automatically loaded and ready to use with your hubot. Read more about customizing hubot by [writing your own scripts](scripting.html).

## Adapters

Hubot uses the adapter pattern to support multiple chat-backends. Here is a [list of available adapters](adapters.html), along with details on how to configure them. Please note that Hubot is undergoing major changes and old adapters may no longer work with the latest version of Hubot (anything after 3.5).

## Deploying

You can deploy hubot to Heroku, which is the officially supported method. Additionally you are able to deploy hubot to a UNIX-like system or Windows. Please note the support for deploying to Windows isn't officially supported.

* [Deploying Hubot onto Azure](./deploying/azure.html)
* [Deploying Hubot onto Bluemix](./deploying/bluemix.html)
* [Deploying Hubot onto Heroku](./deploying/heroku.html)
* [Deploying Hubot onto Unix](./deploying/unix.html)
* [Deploying Hubot onto Windows](./deploying/windows.html)

## Redis

Hubot can use Redis to persist data, so if you want to persist data, then you should have Redis running on your machine accessible via `localhost`. Then, ensure that `hubot-redis-brain` is listed in `external-scripts.json` as an `Array` of module names (e.g. `["hubot-redis-brain"]`) or an `object` where the key is the name of the module (e.g. `{"hubot-redis-brain": "some arbitrary value"}`) where the value of the property in the object is passed to the module function as the second argument. The first argument being the hubot Robot instance.

An example `external-scripts.json` file might look like the following:

```json
["hubot-redis-brain", "hubot-help", "hubot-diagnostics"]
```

or

```json
{
    "hubot-redis-brain": "some arbitrary value",
    "hubot-help": "this value will be sent to the hubot-help module",
    "hubot-diagnostics": {
        "name": "test",
        "age": "21"
    }
}
```

## Patterns

Using custom scripts, you can quickly customize Hubot to be the most life embettering robot he or she can be. Read [docs/patterns](patterns.html) for some nifty tricks that may come in handy as you teach your hubot new skills.