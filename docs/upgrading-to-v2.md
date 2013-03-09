With the release of v2 of Hubot it's time for everyone to update their Hubots! Version 2 brings a big overhaul in the way adapters work. Fortunately we've tried to make updating your Hubot as simple as it can be.

## If you're using the Campfire adapter

If you're using Hubot with the Campfire adapter updating for you guys is the simplest. All you need to do is clone your hubot instance down from Heroku using `git`.

Edit the `package.json` and change the version of the hubot dependency to `>= 2.0.0` so it should look something like the following:

```
{
  "name":        "hosted-hubot",
  "version":     "0.2.0",
  "author":      "GitHub Inc.",
  "keywords":    "github hubot campfire bot",
  "description": "A simple helpful Robot for your Company",
  "licenses":     [{
   "type":       "MIT",
   "url":        "http://github.com/github/hubot/raw/master/LICENSE"
  }],

  "repository" : {
    "type" : "git",
    "url" : "http://github.com/github/hubot.git"
  },

  "dependencies": {
    "hubot": ">= 2.0.0",
    "hubot-scripts": ">= 2.0.2",
    "optparse": "1.0.3"
  }
}
```

Commit the changes and push back up to Heroku and your Hubot should function as normal.

## Using another adapter

If you're using a non-Campfire adapter, the new adapter changes are going to affect you the most. Non-Campfire adapters have become third-party external dependencies. If you're using an adapter that hasn't been moved to a third-party package you should stick with the version of Hubot you are currently running until the package is published. If you're using an adapter whose package has been published you should follow the above `package.json` changes, but you will also need to add a new dependency on the adapter package you wish to use. For example if I were using the XMPP adapter, my `package.json` would look like the following.

```
{
  "name":        "hosted-hubot",
  "version":     "0.2.0",
  "author":      "GitHub Inc.",
  "keywords":    "github hubot campfire bot",
  "description": "A simple helpful Robot for your Company",
  "licenses":     [{
   "type":       "MIT",
   "url":        "http://github.com/github/hubot/raw/master/LICENSE"
  }],

  "repository" : {
    "type" : "git",
    "url" : "http://github.com/github/hubot.git"
  },

  "dependencies": {
    "hubot": ">= 2.0.0",
    "hubot-scripts": ">= 2.0.2",
    "hubot-xmpp": ">= 0.0.1",
    "optparse": "1.0.3"
  }
}
```

Then you will need to make sure the `Procfile` `-a` option is the name of the adapter without the `hubot-` part. For example if I were using the `hubot-partychat-hooks` adapter my `Procfile` would have `-a partychat-hooks` as the adapter. If you are having issues using an adapter please fill an issue on the adapter's repository. Once you've committed the changes you can push back to Heroku and hopefully your Hubot will be alive and kickin'.

