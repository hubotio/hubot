---
title: Development adapter
layout: layouts/docs.html
permalink: /adapters/development.html
---

# Development adapter

## Adapter Basics

All adapters inherit from the Adapter class in the `src/adapter.js` file.

If you're writing your adapter in ES2015, you must require the ES2015 entrypoint instead:

```javascript
const Adapter = require('hubot/es2015').Adapter;
```

There are certain methods that you will want to override.  Here is a basic stub of what an extended Adapter class would look like:

```javascript
const Adapter = require('../adapter')
const User = require('../user')
const TextMessage = require('../message').TextMessage
class Sample extends Adapter {
    constructor(robot) {
        super(robot)
        this.robot.logger.info('Constructor')
    }
    send(envelope, ...strings) {
        this.robot.logger.info('Send')
    }
    reply(envelope, ...strings) {
        this.robot.logger.info('Reply')
    }
    run() {
        this.robot.logger.info('Run')
        this.emit('connected') // The 'connected' event is required to trigger loading of Hubot scripts.
        const user = new User(1001, 'Sample User')
        const message = new TextMessage(user, 'Some Sample Message', 'MSG-001')
        this.robot.receive(message)
    }
}
exports.use = (robot) => new Sample(robot)
```

## Option 1. Setting Up Your Development Environment

1. Create a new folder for your adapter `hubot-sample`
  - `mkdir hubot-sample`
2. Change your working directory to `hubot-sample`
  - `cd hubot-sample`
3. Run `npm init` to create your package.json
  - make sure the entry point is `src/sample.js`
4. Add your `.gitignore` to include `node_modules`
5. Edit the `src/sample.js` file to include the above stub for your adapter
6. Edit the `package.json` to add a peer dependency on `hubot`

  ```json
  "dependencies": {
  },
  "peerDependencies": {
    "hubot": ">=3.0"
  },
  "devDependencies": {
    "coffeescript": ">=1.2.0"
  }
  ```

7. Generate your Hubot using the `npx hubot --create myhubot`
8. Change working directories to the `hubot` you created in step 7.
9. Now perform an `npm link` to add your adapter to `hubot`
  - `npm link ../hubot-sample`
10. Run `hubot -a sample`

## Gotchas

There is a an open issue in the node community around [npm linked peer dependencies not working](https://github.com/npm/npm/issues/5875). To get this working for our project you will need to do some minor changes to your code.

1. For the import in your `hubot-sample` adapter, add the following code

  ```javascript
  let  {Robot,Adapter,TextMessage,User} = {}
  try {
    {Robot,Adapter,TextMessage,User} = require('hubot')
  } catch {
    const prequire = require('parent-require')
    {Robot,Adapter,TextMessage,User} = prequire('hubot')
  }
  ```
2. In your `hubot-sample` folder, modify the `package.json` to include the following dependency so this custom import mechanism will work

  ```json
  "dependencies": {
    "parent-require": "^1.0.0"
  }
  ```
3. Now try running `hubot -a sample` again and see that the imports are properly loaded.
4. Once this is working properly, you can build out the functionality of your adapter as you see fit.  Take a look at some of the other adapters to get some ideas for your implementation.
  - Once packaged and deployed via `npm`, you won't need the dependency in `hubot` anymore since the peer dependency should work as an official module.

## Option 2. Setting Up Your Development Environment

Another option is to load the file from local disk.

1. Create a new folder for your adapter `hubot-sample`
  - `mkdir hubot-sample`
2. Change your working directory to `hubot-sample`
  - `cd hubot-sample`
3. Run `npm init` to create your package.json
  - make sure the entry point is `src/sample.js`
4. Add your `.gitignore` to include `node_modules`
5. Edit the `src/sample.js` file to include the above stub for your adapter
6. Edit the `package.json` to add a peer dependency on `hubot`

  ```json
  "dependencies": {
  },
  "peerDependencies": {
    "hubot": ">=9"
  },
  "devDependencies": {
    "coffeescript": ">=2.7.0"
  }
  ```

7. Run `npx hubot -p ./src -a sample.js`
