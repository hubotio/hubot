---
layout: docs
permalink: /docs/adapters/development/index.html
---

# Adapter Basics

All adapters inherit from the Adapter class in the `src/adapter.coffee` file.  There are certain methods that you will want to override.  Here is a basic stub of what an extended Adapter class would look like:

```coffee
class Sample extends Adapter

  constructor: ->
    super
    @robot.logger.info "Constructor"

  send: (envelope, strings...) ->
    @robot.logger.info "Send"

  reply: (envelope, strings...) ->
    @robot.logger.info "Reply"

  run: ->
    @robot.logger.info "Run"
    @emit "connected"
    user = new User 1001, name: 'Sample User'
    message = new TextMessage user, 'Some Sample Message', 'MSG-001'
    @robot.receive message


exports.use = (robot) ->
  new Sample robot
```

# Setting Up Your Development Environment

1. Create a new folder for your adapter `hubot-sample`
  - `mkdir hubot-sample`
2. Change your working directory to `hubot-sample`
  - `cd hubot-sample`
3. Run `npm init` to create your package.json
  - make sure the entry point is `src/sample.coffee`
4. Add your `.gitignore` to include `node_modules`
5. Edit the `src/sample.coffee` file to include the above stub for your adapter
6. Edit the `package.json` to add a peer dependency on `hubot`

  ```json
  "dependencies": {
  },
  "peerDependencies": {
    "hubot": ">=2.0"
  },
  "devDependencies": {
    "coffee-script": ">=1.2.0"
  }
  ```
  
7. Generate your Hubot using the `yo hubot` [command](https://hubot.github.com/docs/)
8. Change working directories to the `hubot` you created in step 7.
9. Now perform an `npm link` to add your adapter to `hubot`
  - `npm link ../hubot-sample`
10. Run `hubot -a sample`

# Gotchas

There is a an open issue in the node community around [npm linked peer dependencies not working](https://github.com/npm/npm/issues/5875).  To get this working for our project you will need to do some minor changes to your code.

1. For the import in your `hubot-sample` adapter, add the following code
```coffee
try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'
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
