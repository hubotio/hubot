# Scripting

Hubot out of the box doesn't do too much, but it is an extensible, scriptable robot friend.

## Anantomy of a script

When you created your hubot, the generator also creates a `scripts` directory. If you peak around there, you can see some examples of scripts. For a script to be a script, it needs to:

* live in a directory on the hubot script load path (`src/scripts` and `scripts` by default)
* be a `.coffee` or `.js` file
* export a function

By export a function, we just mean: 

```coffeescript
module.exports = (robot) ->
  # your code here
```

The `robot` parameter is an instance of your robot friend. At this point, we can start scripting up some awesomeness.


## Hear & respond

Since this is a chat bot, the most common interactions are based on messages. Hubot can `hear` messages said in a room or `respond` to messages directly addressed at it. Both methods take a regular expression and a callback function as parameters. For example:


```coffeescript
module.exports = (robot) ->
  robot.hear /badger/i, (msg) ->
    # your code here

  robot.respond /open the pod bay doors/i, (msg) ->
    # your code here
```

The `robot.hear /badgers/`'s callback is called for messages containing text like "Stop badgering the witness", or "badger me", or "what exactly is a badger anyways"? As long as the message's text matches, the callback is called.

The `robot.respond /open the pod bay doors/i` callback is only called for messages that are immediately preceeded by the robot's name or alias. If the robot's name is HAL and alias is /, then this callback would be triggered for "hal open the pod bay doors", "HAL: open the pod bay doors", "@HAL open the pod bay doors", "/open the pod bay doors". It wouldn't be called for "HAL: please open the pod bay doors" (because it's `respond` is bound to the text immediately following the robot name) or "has anyone ever mentioned how lovely you are when you open pod bay doors?" (because it lacks the robot's name).

## Send & reply

The `msg` parameter is, despite the name, an instance of [Message](../src/response.coffee). With it, you can `send` a message back to the room the `msg` came from, or `reply` to the person that sent the message. For example:

```coffeescript
module.exports = (robot) ->
  robot.hear /badger/i, (msg) ->
    msg.send "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS"

  robot.respond /open the pod bay doors/i, (msg) ->
    msg.reply "I'm afraid I can't let you do that."
```

`robot.hear /badgers/`'s callback sends a message exactly as specified regardless of who said it, "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS". 

If a user Dave says "HAL: open the pod bay doors", `robot.respond /open the pod bay doors/i` callback sends a message "Dave: I'm afraid I can't let you do that."

## Capturing data

So far, our scripts have had static responses, which while amusing, are boring functionality-wise. `msg.match` has the result of `match`ing the incoming message against the regular expression. This is just a [javascript thing](http://www.w3schools.com/jsref/jsref_match.asp), which ends up being an array with index 0 being the full text matching the expression. If you include capture groups, those will be populated in the other indexes. For example, if we update a script like:


```coffeescript
  robot.respond /open the (.*) doors/i, (msg) ->
    # your code here
```

If Dave says "HAL: open the pod bay doors", then `msg.match[0]` is "open the pod bay doors", and `msg.match[1]` is just "pod bay" doors. Now we can start doing more dynamic things:

```coffeescript
  robot.respond /open the (.*) doors/i, (msg) ->
    doorType = msg.match[1]
    if doorType == "pod bay"
      msg.reply "I'm afraid I can't let you do that."
    else
      msg.reply "Opening #{doorType} doors"
```


## TODO

* [ ] enter & leave
* [ ] topic
* [ ] catch all
* [ ] environment variables and configuration
* [ ] dependencies
* [ ] http client
* [ ] interval and timeout
* [ ] http end points
* [ ] events
