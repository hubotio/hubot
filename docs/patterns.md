---
permalink: /docs/patterns/index.html
layout: docs
---

Shared patterns for dealing with common Hubot scenarios.

## Renaming the Hubot instance

When you rename Hubot, he will no longer respond to his former name. In order to train your users on the new name, you may choose to add a deprecation notice when they try to say the old name. The pattern logic is:

* listen to all messages that start with the old name
* reply to the user letting them know about the new name

Setting this up is very easy:

1. Create a [bundled script](/docs/scripting.md) in the `scripts/` directory of your Hubot instance called `rename-hubot.coffee`
2. Add the following code, modified for your needs:

```coffeescript
# Description:
#   Tell people hubot's new name if they use the old one
#
# Commands:
#   None
#
module.exports = (robot) ->
  robot.hear /^hubot:? (.+)/i, (res) ->
    response = "Sorry, I'm a diva and only respond to #{robot.name}"
    response += " or #{robot.alias}" if robot.alias
    res.reply response
    return

```

In the above pattern, modify both the hubot listener and the response message to suit your needs.

Also, it's important to note that the listener should be based on what hubot actually hears, instead of what is typed into the chat program before the Hubot Adapter has processed it. For example, the [HipChat Adapter](https://github.com/hipchat/hubot-hipchat) converts `@hubot` into `hubot:` before passing it to Hubot.

## Deprecating or Renaming Listeners

If you remove a script or change the commands for a script, it can be useful to let your users know about the change. One way is to just tell them in chat or let them discover the change by attempting to use a command that no longer exists. Another way is to have Hubot let people know when they've used a command that no longer works.

This pattern is similar to the Renaming the Hubot Instance pattern above:

* listen to all messages that match the old command
* reply to the user letting them know that it's been deprecated

Here is the setup:

1. Create a [bundled script](scripting.md) in the `scripts/` directory of your Hubot instance called `deprecations.coffee`
2. Copy any old command listeners and add them to that file. For example, if you were to rename the help command for some silly reason:

```coffeescript
# Description:
#   Tell users when they have used commands that are deprecated or renamed
#
# Commands:
#   None
#
module.exports = (robot) ->
  robot.respond /help\s*(.*)?$/i, (res) ->
    res.reply "That means nothing to me anymore. Perhaps you meant `docs` instead?"
    return

```

## Forwarding all HTTP requests through a proxy

In many corporate environments, a web proxy is required to access the Internet and/or protected resources. For one-off control, use can specify an [Agent](https://nodejs.org/api/http.html) to use with `robot.http`. However, this would require modifying every script your robot uses to point at the proxy. Instead, you can specify the agent at the global level and have all HTTP requests use the agent by default.

Due to the way node.js handles HTTP and HTTPS requests, you need to specify a different Agent for each protocol. ScopedHTTPClient will then automatically choose the right ProxyAgent for each request.

```coffeescript
proxy = require 'proxy-agent'
module.export = (robot) ->
  robot.globalHttpOptions.httpAgent  = proxy('http://my-proxy-server.internal', false)
  robot.globalHttpOptions.httpsAgent = proxy('http://my-proxy-server.internal', true)
```
