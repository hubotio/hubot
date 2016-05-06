---
permalink: /docs/deploying/bluemix/index.html
layout: docs
---

If you've been following along with [Getting Started](../index.md), it's time
to deploy so you can use it beyond just your local machine.
[IBM Bluemix](http://bluemix.net) is a way to deploy hubot as an alternative to
[Heroku](/docs/deploying/heroku.md). It is built on the open-source project
[Cloud Foundry](https://www.cloudfoundry.org/), so we'll be using the `cf cli`
throughout these examples.

Unlike Heroku, the free tier on Bluemix supports 24/7 uptime, so you don't need
to go through the hassle of setting up something like
[hubot-heroku-keepalive](https://github.com/hubot-scripts/hubot-heroku-keepalive).

You will need to install the
[Cloud Foundry CLI](https://github.com/cloudfoundry/cli/releases), and create a
[Bluemix Account](http://bluemix.net).

First we need to define a `manifest.yml` file in the root directory (and delete
the generated `procfile`). The contents of the manifest at the bare minimum
should look like:

```yml
applications:
- buildpack: https://github.com/jthomas/nodejs-v4-buildpack.git
  command: ./bin/hubot --adapter slack
  path: .
  instances: 1
  memory: 256M
```

In this example, we're using the slack adapter (as shown by the start command).
Of course, the start command can be whatever you need to start your specific
hubot. You can optionally set a `host`, and `name`, and much more, or you can
set those up through the Bluemix GUI in the dashboard. For thorough
documentation on what the `manifest.yml` file does and how it used and how to
configure your own, see
[these docs](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html).

You then need to connect your hubot project to Bluemix:

```sh
$ cd your_hubot_project
$ cf api https://api.ng.bluemix.net
$ cf login
```

This will prompt you with your login credentials. Then to deploy your hubot, all
you need to do is:

```sh
$ cf push NAME_OF_YOUR_HUBOT_APP
```

Note: if you do not specify a `name` and `host` in your manifest, you will have
needed to create a `Node.js` Cloudfoundry app in the Bluemix dashboard. You then
use the name that of that app in your `cf push` command. For very thorough
documentation on deploying a Node.js app to Bluemix, please
[read here](https://www.ng.bluemix.net/docs/starters/nodejs/index.html), for
very thorough documentation of the command line interface, please
[read here](https://www.ng.bluemix.net/docs/cli/reference/cfcommands/index.html).

Finally you will need to add the environment variables to the website to make
sure it runs properly. You can either do it through the GUI (under your app's
dashboard) or you can use the command line, as follows (example is showing slack
as an adapter):

```sh
$ cf set-env NAME_OF_YOUR_HUBOT_APP HUBOT_SLACK_TOKEN TOKEN_VALUE
```

### Usage With Git

It is not mandatory to use Bluemix with git, but Bluemix supports delivery
pipelines that can be tied to Github, Github Enterprise, or a private JazzHub
repo.

Inside your new hubot directory, make sure you've created a git repository,
and that your work is committed:

```sh
$ git init
$ git add .
$ git commit -m "Initial commit"
```

Then [create a GitHub repository](https://help.github.com/articles/create-a-repo/)
for your hubot. This is where Bluemix will pull your code from instead of
needing to deploy directly from your dev machine to Bluemix.

```sh
$ git remote add origin _your GitHub repo_
$ git push -u origin master
```

Once you have your GitHub repo, navigate to your project dashboard, and click
"add git" (in the upper right hand corner). This will guide you through the
process of using either your Github account, or setting up a JazzHub account.
You can then add any permutations of test/build/deploy stages into your
pipeline. For thorough documentation on that, see
[here](https://www.ng.bluemix.net/docs/#services/DeliveryPipeline/index.html#getstartwithCD).

### Further Reading

  - [Deploying Cloud Foundry Apps To Bluemix](https://www.ng.bluemix.net/docs/cfapps/runtimes.html)
  - [Neploying Node.js Apps to Bluemix](https://www.ng.bluemix.net/docs/starters/nodejs/index.html)
  - [Setting up your manifest](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html)
  - [Understanding the CF CLI](https://www.ng.bluemix.net/docs/cli/reference/cfcommands/index.html)
  - [Setting up a Build Pipleline in Bluemix](https://www.ng.bluemix.net/docs/#services/DeliveryPipeline/index.html#getstartwithCD)
