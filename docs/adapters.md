# Hubot Adapters

Adapters are the interface to the service you want your hubot to run on.

## Available Adapters

### Built-in

These adapters are ones which are built into the hubot core.

* [Campfire](https://github.com/github/hubot/wiki/Adapter:-Campfire)
* [Shell](https://github.com/github/hubot/wiki/Adapter:-Shell)

### Third Party

These adapters are ones which are separate packages available with `npm`.

* [Flowdock](https://github.com/github/hubot/wiki/Adapter:-Flowdock)
* [HipChat](https://github.com/github/hubot/wiki/Adapter:-HipChat)
* [IRC](https://github.com/github/hubot/wiki/Adapter:-IRC)
* [Partychat](https://github.com/github/hubot/wiki/Adapter:-Partychat)
* [Talker](https://github.com/github/hubot/wiki/Adapter:-Talkerapp)
* [Tetalab](https://github.com/github/hubot/wiki/Adapter:-Tetalab)
* [Twilio](https://github.com/github/hubot/wiki/Adapter:-Twilio)
* [Twitter](https://github.com/github/hubot/wiki/Adapter:-Twitter)
* [XMPP](https://github.com/github/hubot/wiki/Adapter:-XMPP)
* [Gtalk](https://github.com/github/hubot/wiki/Adapter:-Gtalk)
* [Yammer](https://github.com/github/hubot/wiki/Adapter:-Yammer)
* [Skype](https://github.com/netpro2k/hubot-skype)
* [Jabbr](https://github.com/smoak/hubot-jabbr)
* [iMessage](https://github.com/github/hubot/wiki/Adapter:-iMessage)

### Writing your own adapter

The best place to start is `src/adapter.coffee`, and inheriting from `Adapter`. There is not as much documentation as could exist, so it is worth reviewing existing adapters as well as how hubot internally uses an adpater.
