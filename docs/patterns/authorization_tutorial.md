# Authorization for Hubot

Authorization is the ability to scope certain commands for certain people. This is accomplished by two scripts and redis that come with 
the basic install of hubot: [auth.coffee](https://github.com/github/hubot/blob/master/src/scripts/auth.coffee) and [roles.coffee](https://github.com/github/hubot/blob/master/src/scripts/roles.coffee). This tutorial is designed to get a basic understanding of setting it up, so you concentrate on figuring out where to use it as quickly as possible.

NOTE: This is only for an example you'll want to remove this after you've walked through this tutorial.

## Setting up Hubot's Admins

First thing you need to do is set up your `HUBOT_AUTH_ADMIN`. You've probably seen these lines when you started up hubot via the shell:

```
Hubot> [Sat Feb 22 2014 12:50:00 GMT-0600 (CST)] WARNING The HUBOT_AUTH_ADMIN environment variable not set
[Sat Feb 22 2014 12:50:01 GMT-0600 (CST)] INFO Data for brain retrieved from Redis
```

Go ahead and type the following at the hubot commandline:

```
Hubot> Hubot show users
```

It should come back with `1 Shell` which is the default user that Hubot knows about. Take note of that number 1. Go ahead and exit out of 
hubot and open up your `bin/hubot`.

Add the following something like this:

```bash
HUBOT_AUTH_ADMIN = "1"
exec node_modules/.bin/hubot "$@"
```

Start up hubot again via `bin/hubot`.

Go ahead and type the following at the hubot command line:

```
Hubot> Hubot what role does shell have
Hubot> Shell: shell has the following roles:  and is also an admin.
Hubot>
```

You now have a first user locally that has the admin rights. If you have a running external hubot, your unique ids from `Hubot show users` will be different, export the list with commas and
restart hubot.

## Setting up the first role

Hubot admins are the only ones that can give out roles. So after you make yourself an admin, you still need to test out giving and taking away roles.
Follow the following commands on your shell version of hubot and you should see the expected results:

```
Hubot> Hubot what role does shell have
Hubot> Shell: shell has the following roles:  and is also an admin.
Hubot> Hubot shell has ping role
Hubot> Shell: Ok, shell has the 'ping' role.
Hubot> Hubot what role does shell have
Hubot> Shell: shell has the following roles: ping and is also an admin.
Hubot>
```

As you can see `shell` is the only user that has the admin rights. Then we gave `shell` the ping role and confirmed it got that role.  Remember roles are the basis of grouping
specific users into groups.

## Setting up your first script with authorization

In order to have authorization to work, you'll need to edit some of your scripts. I'm going to start with [ping.coffee](https://github.com/github/hubot/blob/master/src/scripts/ping.coffee) in my
`scripts/` directory.

Go ahead and open up your ping.coffee. It should look like the following snippet:

```
module.exports = (robot) ->
  robot.respond /PING$/i, (msg) ->
    msg.send "PONG"
```

Edit it so it looks like the following:

```
module.exports = (robot) ->
  robot.respond /PING$/i, (msg) ->
    if robot.auth.hasRole(msg.envelope.user, "ping")
      msg.send "PONG"
    else
     msg.send "Sorry you can't ask me to PONG"
```

This will put a check before the `hubot ping` to confirm that the person saying it is part of the "ping" role.  If you aren't it'll say "Sorry you can't' ask me to PONG."

This it setting up authorization in a nutshell, hopefully this'll help you out to start locking down hubot.
