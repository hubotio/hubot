---
permalink: /docs/adapters/development/
---

# Development adapter

## Adapter Basics

All adapters inherit from the Adapter class in the `src/adapter.js` file.

If you're writing your adapter in ES2015, you must require the ES2015 entrypoint instead:

```javascript
const Adapter = require('botforge/es2015').Adapter;
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
        this.emit('connected')
        const user = new User(1001, 'Sample User')
        const message = new TextMessage(user, 'Some Sample Message', 'MSG-001')
        this.robot.receive(message)
    }
}
exports.use = (robot) => new Sample(robot)
```

## Setting Up Your Development Environment

1. Create a new folder for your adapter `botforge-sample`
  - `mkdir botforge-sample`
2. Change your working directory to `botforge-sample`
  - `cd botforge-sample`
3. Run `npm init` to create your package.json
  - make sure the entry point is `src/sample.coffee`
4. Add your `.gitignore` to include `node_modules`
5. Edit the `src/sample.coffee` file to include the above stub for your adapter
6. Edit the `package.json` to add a peer dependency on `botforge`

  ```json
  "dependencies": {
  },
  "peerDependencies": {
    "botforge": ">=3.0"
  },
  "devDependencies": {
    "coffeescript": ">=1.2.0"
  }
  ```

7. Generate your Botforge using the `yo botforge` [command](https://hubot.github.com/docs/)
8. Change working directories to the `botforge` you created in step 7.
9. Now perform an `npm link` to add your adapter to `botforge`
  - `npm link ../botforge-sample`
10. Run `botforge -a sample`

## Gotchas

There is a an open issue in the node community around [npm linked peer dependencies not working](https://github.com/npm/npm/issues/5875). To get this working for our project you will need to do some minor changes to your code.

1. For the import in your `botforge-sample` adapter, add the following code

  ```javascript
  let  {Robot,Adapter,TextMessage,User} = {}
  try {
    {Robot,Adapter,TextMessage,User} = require('botforge')
  } catch {
    const prequire = require('parent-require')
    {Robot,Adapter,TextMessage,User} = prequire('botforge')
  }
  ```
2. In your `botforge-sample` folder, modify the `package.json` to include the following dependency so this custom import mechanism will work

  ```json
  "dependencies": {
    "parent-require": "^1.0.0"
  }
  ```
3. Now try running `botforge -a sample` again and see that the imports are properly loaded.
4. Once this is working properly, you can build out the functionality of your adapter as you see fit.  Take a look at some of the other adapters to get some ideas for your implementation.
  - Once packaged and deployed via `npm`, you won't need the dependency in `botforge` anymore since the peer dependency should work as an official module.
