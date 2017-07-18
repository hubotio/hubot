---
permalink: /docs/deploying/bluemix/
---

# Deploying to Bluemix

If you've been following along with [Getting Started](../index.md), it's time
to deploy so you can use it beyond just your local machine.
[IBM Bluemix](http://bluemix.net) is a way to deploy hubot as an alternative to
[Heroku](heroku.md). It is built on the open-source project
[Cloud Foundry](https://www.cloudfoundry.org/), so we'll be using the `cf cli`
throughout these examples.

Hubot was originally very closely coupled to Heroku, so there are a couple of
things to clean up first that we don't need or that might get in the way on
another platform:
* remove `Procfile` as we'll create the `manifest.yml` that Bluemix needs in a
 moment
* remove the `hubot-heroku-keepalive` line from `external_scripts.json` and also
 remove the related npm module (it causes errors on other platforms):

  npm uninstall --save hubot-heroku-keepalive

In preparation for working with Bluemix, install the [Cloud Foundry
CLI](https://github.com/cloudfoundry/cli/releases), and create a [Bluemix
Account](http://bluemix.net).

First we need to define a `manifest.yml` file in the root directory. The
contents of the manifest at the bare minimum should look like:

```yml
applications:
- name: myVeryOwnHubot
  command: ./bin/hubot --adapter slack
  instances: 1
  memory: 512M
```

In this example, we're using the slack adapter, if you choose slack as your
adapter when creating a hubot this will work, otherwise add the `hubot-slack`
module to your `package.json`.  **Change the name of your hubot in the
`manifest.yml` file** because otherwise your application will clash with someone
else's who already deployed an app called this!  There are many more useful
things you can change about your hubot using the manifest file, so check out
[these docs](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html)
for more information.

You then need to connect your hubot project to Bluemix:

```sh
$ cd your_hubot_project
$ cf api https://api.ng.bluemix.net
$ cf login
```

Note that the `cf api` command changes per Bluemix region so to deploy somewhere
other than "US South", replace this api as appropriate.  The `cf login` command
will prompt you with your login credentials.

Next, we need to set up our environment variables, but we need to create the app
first.  It won't work properly without the environment variables it needs, so
we'll first of all use the `--no-start` flag to deploy but not attempt to start
it.

```sh
$ cf push NAME_OF_YOUR_HUBOT_APP --no-start
```

Now the app exists, we can set its environment variables.  To access slack,
you'll need a slack token from the "Apps and Integrations" page; it's visible
when you go to create a slackbot.  Copy that token and set it as an environment
variable called `HUBOT_SLACK_TOKEN`, like this:

```sh
$ cf set-env NAME_OF_YOUR_HUBOT_APP HUBOT_SLACK_TOKEN TOKEN_VALUE
```

If you have other environment variables to set, such as configuring the
`REDIS_URL` for `hubot-redis-brain`, this is a good time to do that.

Finally, we're ready to go!  Deploy "for real" this time:

```sh
$ cf push NAME_OF_YOUR_HUBOT_APP
```

You should see your bot connect to slack!

### Further Reading

  - [Deploying Cloud Foundry Apps To Bluemix](https://www.ng.bluemix.net/docs/cfapps/runtimes.html)
  - [Neploying Node.js Apps to Bluemix](https://www.ng.bluemix.net/docs/starters/nodejs/index.html)
  - [Setting up your manifest](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html)
  - [Understanding the CF CLI](https://www.ng.bluemix.net/docs/cli/reference/cfcommands/index.html)
  - [Setting up a Build Pipleline in Bluemix](https://www.ng.bluemix.net/docs/#services/DeliveryPipeline/index.html#getstartwithCD)

### Troubleshooting

**Bot doesn't connect**

Check your logs for more information using the command `cf logs YOUR_APP_NAME
--recent`.  If you have NodeJS installed locally, you can also try running the
bot on your local machine to inspect any output: simply do `bin/hubot` from the
top level of the project.

**Bot crashes repeatedly**

It is sometimes necessary to to assign more memory to your hubot, depending
which plugins you are using (if your app crashes with error 137, try increasing
the memory limit).

