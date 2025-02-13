![Pipeline Status](https://github.com/hubotio/hubot/actions/workflows/pipeline.yml/badge.svg)

![Build Status: MacOS](https://github.com/hubotio/hubot/actions/workflows/nodejs-macos.yml/badge.svg)
![Build Status: Ubuntu](https://github.com/hubotio/hubot/actions/workflows/nodejs-ubuntu.yml/badge.svg)
![Build Status: Window](https://github.com/hubotio/hubot/actions/workflows/nodejs-windows.yml/badge.svg)

# Hubot

**Note: v10.0.4 accidentally contains the removal of CoffeeScript; v10.0.5 puts it back in**
**Note: v11 removes CoffeeScript and converts this codebase to ESM**

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
npx hubot --create myhubot --adapter @hubot-friends/hubot-discord
npx hubot --create myhubot --adapter @hubot-friends/hubot-ms-teams
npx hubot --create myhubot --adapter @hubot-friends/hubot-irc
```

Review `scripts/example.mjs`. Create more scripts in the `scripts` folder.

## TypeScript Support

Hubot now supports TypeScript scripts! You can write your scripts in TypeScript to get:
- Better IDE support with type definitions
- Early error detection through type checking
- Modern JavaScript features

To use TypeScript:
1. Create `.ts` files in your scripts directory
2. Run `npm run build` to compile TypeScript files
3. Start Hubot as normal with `npm start`

During development, use `npm run watch` for automatic compilation.

See the [TypeScript documentation](https://hubotio.github.io/hubot/typescript.html) for more details.

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).

# Hubot History

[Say hello to Hubot](https://github.blog/2011-10-25-say-hello-to-hubot/)

[Cartoon with Hubot](https://www.youtube.com/watch?v=vq2jYFZVMDA&t=129s)

[The Most Important Startup's Hardest Worker Isn't a Person](https://www.wired.com/2015/10/the-most-important-startups-hardest-worker-isnt-a-person/)

[The Story of Hubot](https://www.youtube.com/watch?v=Je4TjjtFDNU)

[Hubot by Hubotics](https://www.theoldrobots.com/hubot.html)

[Automating Inefficiencies](https://zachholman.com/2011/01/automating-inefficiencies/)

[Getting Started with Hubot](https://www.youtube.com/watch?v=A7fh6RIzGrw)
