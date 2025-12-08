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

## Cheap Design Principle

This codebase is being incrementally refactored using Pfeifer's Cheap Design idea: simplify control by leveraging structure and existing platform capabilities. Rather than maintaining multiple near-duplicate code paths, we consolidate them and let data (like file extensions or loader state) drive behavior.

### Script Loading (Applied)
Replaced three largely similar loaders (`loadjs`, `loadmjs`, `loadts`) in `src/Robot.mjs` with a single internal `_loadScript` function invoked by thin wrappers:
- Reduced branching: one import path, fewer error surface areas
- Clearer warnings: unified message when default export is not a function
- Easier extension: new script types map to the same loader

### Adapter Loading (Applied)
Eliminated nested if/else branching in `loadAdapter` by introducing a **resolver table** in `_selectAdapterResolver`. Each adapter loading strategy (built-in, local file, npm package) is now a simple, isolated resolver function:
- **Data-driven dispatch**: Resolver selection based on adapter state and path extension, not control flow
- **Separated concerns**: Each resolver (`_loadBuiltinAdapter`, `_loadLocalAdapter`, `_loadNpmAdapter`) has one responsibility
- **Extensible pattern**: Adding a new adapter type requires only a new resolver and condition, no new if/else chains

### Catch-All Listener Fallback (Applied)
Eliminated recursive fallback logic in `processListeners` by replacing it with simple in-place message conversion:
- **No recursion**: Instead of calling `receive()` recursively, convert the original message to `CatchAllMessage` and re-process the same listener loop
- **Uniform dispatch**: Catch-all listeners now compete equally with all listeners—they just match only on `CatchAllMessage` types
- **Cleaner control flow**: The fallback is now just data transformation, not special-case control logic

### Help Parsing Extraction (Applied)
Extracted help documentation parsing logic from `Robot.mjs` into a dedicated `src/HelpParser.mjs` utility module:
- **Single responsibility**: `HelpParser` handles all comment extraction and section parsing; `Robot` just collects commands
- **Reduced coupling**: Robot no longer needs to know about comment markers, header blocks, or legacy syntax detection
- **Testable in isolation**: Help parsing logic can be tested independently without creating a Robot instance
- **Removed 4 helper functions**: `toHeaderCommentBlock`, `isCommentLine`, `removeCommentPrefix`, and parsing logic are now in the utility

### Middleware Consolidation (Applied)
Added `executeAndAllow()` helper method to `Middleware` class to standardize the common "execute and check for false" pattern:
- **Reduced boilerplate**: `Robot.receive()` and `Response.#runWithMiddleware()` now use `executeAndAllow()` instead of `execute()` + conditional check
- **Clearer intent**: The method name expresses the actual operation: "execute middleware and allow if it doesn't forbid"
- **Consistent semantics**: All middleware checks now use the same idiomatic pattern across Robot, Response, and Listener

### Response Method Consolidation (Applied)
Eliminated six nearly-identical response methods (`send`, `emote`, `reply`, `topic`, `play`, `locked`) from `src/Response.mjs`:
- **Method registry**: All methods now defined in `RESPONSE_METHODS` object mapping method names to their options (e.g., `plaintext: true`)
- **Dynamic generation**: Methods are generated once at module load via `Object.entries()` and prototype assignment—no code duplication
- **Easy extension**: Adding a new response type requires only adding an entry to the registry, not writing a full method
- **Reduced lines**: Eliminated 60+ lines of boilerplate; core logic is now just the `_runWithMiddleware` helper

### Brain User Lookup Consolidation (Applied)
Unified three similar user search methods in `src/Brain.mjs` using a single internal `_findUsers()` helper with pluggable predicates:
- **Unified search logic**: `userForName`, `usersForRawFuzzyName`, and `usersForFuzzyName` all call `_findUsers` with different predicates
- **Pluggable predicates**: Each predicate function encapsulates its specific matching logic (exact, prefix, etc.) independently
- **Single return pattern**: Helper manages both single-result and array-result cases via `returnSingle` parameter
- **Eliminated duplication**: Removed manual loops, reducing code size while keeping all public APIs identical

### Adapter Method Consolidation (Applied)
Eliminated near-duplicate `emote()` and `reply()` methods from Shell and Campfire adapters by introducing `_createSendDelegate()` in the base Adapter class:
- **Formatter-based consolidation**: Each adapter defines formatters (e.g., `#emoteFormatter`, `#replyFormatter`) that transform strings before sending
- **Reusable helper**: `_createSendDelegate(formatter)` returns an async function that applies the formatter to all strings, then calls `send()`
- **Reduced adapter code**: Shell and Campfire now use one-liners: `emote = this._createSendDelegate(this.#emoteFormatter)`
- **Extensible pattern**: New adapters can reuse the helper for any string-transformation-then-send pattern

### Listener Registration Consolidation (Applied)
Eliminated near-duplicate message-type listener registration methods (`enter`, `leave`, `topic`) in `src/Robot.mjs` using a static registry and helper:
- **Registry-driven dispatch**: `LISTENER_REGISTRY` maps message type keys (e.g., 'enter') to their predicate functions
- **Unified registration helper**: `_registerListener(registryKey, options, callback)` looks up the predicate and delegates to `listen()`
- **Reduced boilerplate**: Each method (`enter`, `leave`, `topic`) now a one-liner calling `_registerListener` with its registry key
- **Extensible design**: Adding a new message-type listener requires only adding an entry to the registry, not a full new method
- **Clear separation**: Message types and predicates live in the registry; registration logic is isolated in the helper

# Create your own Hubot instance

This will create a directory called `myhubot` in the current working directory.

```sh
npx hubot --create myhubot --adapter @hubot-friends/hubot-slack
npx hubot --create myhubot --adapter @hubot-friends/hubot-discord
npx hubot --create myhubot --adapter @hubot-friends/hubot-ms-teams
npx hubot --create myhubot --adapter @hubot-friends/hubot-irc
```

Review `scripts/example.mjs`. Create more scripts in the `scripts` folder.

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