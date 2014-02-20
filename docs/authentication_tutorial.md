
So you want to add some authentication to hubot eh? Great, this doc should walk you through the majority of it.
First thing first, set up [auth.coffee](https://github.com/github/hubot-scripts/blob/master/src/scripts/auth.coffee), by this 
that means you need to figure out "HUBOT_AUTH_ADMIN". Assuming you have hubot already connecting to a site, run `hubot show users`
and he should come back with all the people he knows about. Grab the id number for the person/people you want to have admin rights.

Add `HUBOT_AUTH_ADMIN="<number>,<nextnumber>"` to the `bin/hubot` or however you add variables to him, go ahead and restart hubot to
see if he now thinks you're and admin.

If all goes well, you should see something like this:
```
Hubot> Hubot what role does shell have
Hubot> Shell: shell has the following roles:  and is also an admin.
Hubot>
```

Great! Lets give shell our first role. I'm going to hack the [ping.coffee](https://github.com/github/hubot/blob/master/src/scripts/ping.coffee)
as the example, so lets give our user the first role:

```
Hubot> Hubot what role does shell have
Hubot> Shell: shell has the following roles:  and is also an admin.
Hubot> Hubot shell has ping role
Hubot> Shell: Ok, shell has the 'ping' role.
Hubot> Hubot what role does shell have
Hubot> Shell: shell has the following roles: ping and is also an admin.
Hubot>
```

As you can see `shell` only has the admin role like expected. Then I gave `shell` the ping role, and checked it. Great. Ok, lets remove ping for now, so we 
can change the [ping.coffee](https://github.com/github/hubot/blob/master/src/scripts/ping.coffee), to fail for us.

```
Hubot> Hubot shell doesn't have ping role
Hubot> Shell: Ok, shell doesn't have the 'ping' role.
Hubot> Hubot what role does shell have
Hubot> Shell: shell has the following roles:  and is also an admin.
Hubot> 
```

Go ahead into your `scripts/` directory, and open up your ping.coffee. Take a look at the following snippet:

```
module.exports = (robot) ->
  robot.respond /PING$/i, (msg) ->
    msg.send "PONG"
```

Pretty straight forward eh? Go ahead and tack on this:

```
module.exports = (robot) ->
  robot.respond /PING$/i, (msg) ->
    if robot.auth.hasRole(msg.envelope.user, "ping")
      msg.send "PONG"
    else
     msg.send "Sorry you can't ask me to PONG"
```

Note: a quick explanation, if hubot responds to "ping" case insensitive, it'll respond with the "PONG" only if you have the role of ping.

Go and ahead and restart hubot, and say PING. :)

```
Hubot> hubot PING
Hubot> Sorry you can't ask me to PONG
```

Sweet!

Ok, next step, lets give ourselves access to make this happen:

```
Hubot> Hubot shell has ping role
Hubot> Shell: Ok, shell has the 'ping' role.
Hubot> hubot PING
Hubot> PONG
Hubot>
```

PERFECT!

So, we now can wrap certain hubot scripts for certain people. But there's a disappointing portion of this; in order to enforce the commands you'll need 
to have the scripts with `robot.auth.hasRole(msg.envelope.user, "<role>")`, this means you'll have to fork the script you want to leverage and dump it in 
your `scripts/` directory, and removed from your `hubot-scripts.json` and `external-scripts.json`.
