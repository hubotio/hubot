# Hubot Adapters

Adapters are the interface to the service you want your hubot to run on.

## Official Adapters

Hubot includes two official adapters:

* [Shell](adapters/shell.md), i.e. for use with development
* [Campfire](adapters/campfire.md)

## Third-party Adapters

Third-party adapters are available as `npm` packages. Here is a list of known
adapters, but please [submit an issue](https://github.com/github/hubot/issues)
to have yours added to the list:

* [Flowdock](https://github.com/flowdock/hubot-flowdock)
* [HipChat](https://github.com/hipchat/hubot-hipchat)
* [IRC](https://github.com/nandub/hubot-irc)
* [Partychat](https://github.com/iangreenleaf/hubot-partychat-hooks)
* [Talker](https://github.com/unixcharles/hubot-talker)
* [Twilio](https://github.com/jkarmel/hubot-twilio)
* [Twitter](https://github.com/MathildeLemee/hubot-twitter)
* [XMPP](https://github.com/markstory/hubot-xmpp)
* [Gtalk](https://github.com/atmos/hubot-gtalk)
* [Yammer](https://github.com/athieriot/hubot-yammer)
* [Skype](https://github.com/netpro2k/hubot-skype)
* [Jabbr](https://github.com/smoak/hubot-jabbr)
* [iMessage](https://github.com/lazerwalker/hubot-imessage)
* [Hall](https://github.com/Hall/hubot-hall)


## Writing Your Own adapter

The best place to start is `src/adapter.coffee`, and inheriting from `Adapter`.
There is not as much documentation as could exist (yet!), so it is worth
reviewing existing adapters as well as how hubot internally uses an adapter.
