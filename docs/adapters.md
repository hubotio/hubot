# Hubot Adapters

Adapters are the interface to the service you want your hubot to run on.

## Official Adapters

Hubot includes two official adapters:

* [Shell](adapters/shell.md), ie for use with development
* [Campfire](adapters/campfire.md)

## Third Party Adapters

Third party adapters are available as `npm` packages. Here is a list of known adapters, but please [submit an issue](https://github.com/github/hubot/issues) to have yours added to the list:

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
* [Hall](https://github.com/Hall/hubot-hall)


## Writing Your Own adapter

The best place to start is `src/adapter.coffee`, and inheriting from `Adapter`.
There is not as much documentation as could exist (yet!), so it is worth reviewing
existing adapters as well as how hubot internally uses an adpater.