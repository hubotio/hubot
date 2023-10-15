![Pipeline Status](https://github.com/hubotio/hubot/actions/workflows/pipeline.yml/badge.svg)

![Build Status: MacOS](https://github.com/hubotio/hubot/actions/workflows/nodejs-macos.yml/badge.svg)
![Build Status: Ubuntu](https://github.com/hubotio/hubot/actions/workflows/nodejs-ubuntu.yml/badge.svg)
![Build Status: Window](https://github.com/hubotio/hubot/actions/workflows/nodejs-windows.yml/badge.svg)

# Hubot

Hubot is a framework to build chat bots, modeled after GitHub's Campfire bot of the same name, hubot.
He's pretty cool. He's [extendable with scripts](https://hubotio.github.io/hubot/docs#scripts) and can work
on [many different chat services](https://hubotio.github.io/hubot/adapters.html).

This repository provides a library that's distributed by `npm` that you
use for building your own bots.  See the [documentation](https://hubotio.github.io/hubot/docs.html)
for details on getting up and running with your very own robot friend.

In most cases, you'll probably never have to hack on this repo directly if you
are building your own bot. But if you do, check out [CONTRIBUTING.md](CONTRIBUTING.md)

# Create your own Hubot instance

This will create a directory called `myhubot` in the current working directory.

```sh
npx hubot --create myhubot --adapter @hubot-friends/hubot-slack
```

Review `scripts/example.mjs`. Create more scripts in the `scripts` folder.

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
