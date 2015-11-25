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

1. Install ProxyAgent. `npm install proxy-agent`
2. Create a [bundled script](/docs/scripting.md) in the `scripts/` directory of your Hubot instance called `proxy.coffee`
3. Add the following code, modified for your needs:

```coffeescript
proxy = require 'proxy-agent'
module.exports = (robot) ->
  robot.globalHttpOptions.httpAgent  = proxy('http://my-proxy-server.internal', false)
  robot.globalHttpOptions.httpsAgent = proxy('http://my-proxy-server.internal', true)
```

## Dynamic matching of messages

In some situations, you want to dynamically match different messages (e.g. factoids, JIRA projects). Rather than defining an overly broad regular expression that always matches, you can tell Hubot to only match when certain conditions are met.

In a simple robot, this isn't much different from just putting the conditions in the Listener callback, but it makes a big difference when you are dealing with middleware: with the basic model, middleware will be executed for every match of the generic regex. With the dynamic matching model, middleware will only be executed when the dynamic conditions are matched.

For example, the [factoid lookup command](https://github.com/github/hubot-scripts/blob/bd810f99f9394818a9dcc2ea3729427e4101b96d/src/scripts/factoid.coffee#L95-L99) could be reimplemented as:

```coffeescript
module.exports = (robot) ->
  # Dynamically populated list of factoids
  facts =
    fact1: 'stuff'
    fact2: 'other stuff'

  robot.listen(
    # Matcher
    (message) ->
      match = message.match(/^~(.*)$/)
      # Only match if there is a matching factoid
      if match and match[1] in facts
        match[1]
      else
        false
    # Callback
    (response) ->
      fact = response.match
      res.reply "#{fact} is #{facts[fact]}"
  )
```

## Restricting access to commands

One of the awesome features of Hubot is its ability to make changes to a production environment with a single chat message. However, not everyone with access to your chat service should be able to trigger production changes.

There are a variety of different patterns for restricting access that you can follow depending on your specific needs:

* Two buckets of access: full and restricted with whitelist/blacklist
* Specific access rules for every command (Role-based Access Control)
* Blacklisting/whitelisting commands in specific rooms

### Simple per-listener access

In some organizations, almost all employees are given the same level of access and only a select few need to be restricted (e.g. new hires, contractors, etc.). In this model, you partition the set of all listeners to separate the "power commands" from the "normal commands".

Once you have segregated the listeners, you need to make some tradeoff decisions around whitelisting/blacklisting users and listeners.

The key deciding factors for whitelisting vs blacklisting of users are the number of users in each category, the frequency of change in either category, and the level of security risk your organization is willing to accept.
* Whitelisting users (users X, Y, Z have access to power commands; all other users only get access to normal commands) is a more secure method of access (new users have no default access to power commands), but has higher maintenance overhead (you need to add each new user to the "approved" list).
* Blacklisting users (all users get access to power commands, except for users X, Y, Z, who only get access to normal commands) is a less secure method (new users have default access to power commands until they are added to the blacklist), but has a much lower maintenance overhead if the blacklist is small/rarely updated.

The key deciding factors for selectively allowing vs restricting listeners are the number of listeners in each category, the ratio of internal to external scripts, and the level of security risk your organization is willing to accept.
* Selectively allowing listeners (all listeners are power commands, except for listeners A, B, C, which are considered normal commands) is a more secure method (new listeners are restricted by default), but has a much higher maintenance overhead (every silly/fun listener needs to be explicity downgraded to "normal" status).
* Selectively restricting listeners (listeners A, B, C are power commands, everything else is a normal command) is a less secure method (new listeners are put into the normal category by default, which could give unexpected access; external scripts are particularly scary here), but has a lower maintenance overhead (no need to modify/enumerate all the fun/culture scripts in your access policy).

As an additional consideration, most scripts do not currently have listener IDs, so you will likely need to open PRs (or fork) any external scripts you use to add listener IDs. The actual modification is easy, but coordinating with lots of maintainers can be time consuming.

Once you have decided which of the four possible models to follow, you need to build the appropriate lists of users and listeners to plug into your authorization middleware.

Example: whitelist of users given access to selectively restricted power commands
```coffeescript
POWER_COMMANDS = [
  'deploy.web' # String that matches the listener ID
]

POWER_USERS = [
  'jdoe' # String that matches the user ID set by the adapter
]

module.exports = (robot) ->
  robot.listenerMiddleware (context, next, done) ->
    if context.listener.options.id in POWER_COMMANDS
      if context.response.message.user.id in POWER_USERS
        # User is allowed access to this command
        next()
      else
        # Restricted command, but user isn't in whitelist
        context.response.reply "I'm sorry, @#{context.response.message.user.name}, but you don't have access to do that."
        done()
    else
      # This is not a restricted command; allow everyone
      next()
```

Remember that middleware executes for ALL listeners that match a given message (including `robot.hear /.+/`), so make sure you include them when categorizing your listeners.

### Specific access rules per listener

For larger organizations, a binary categorization of access is usually insufficient and more complex access rules are required.

Example access policy:
* Each development team has access to cut releases and deploy their service
* The Operations group has access to deploy all services (but not cut releases)
* The front desk cannot cut releases nor deploy services

Complex policies like this are currently best implemented in code directly, though there is [ongoing work](https://github.com/michaelansel/hubot-rbac) to build a generalized framework for access management.

### Specific access rules per room

Organizations that have a number of chat rooms that serve different purposes often want to be able to use the same instance of hubot but have a different set of commands allowed in each room.

Work on generalized blacklist solution is [ongoing](https://github.com/kristenmills/hubot-command-blacklist). A whitelist soultion could take a similar approach.
