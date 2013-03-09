[iMessage](https://www.apple.com/ios/messages/) is Apple's proprietary instant message service.

You should report any issues or submit any pull requests to the
[iMessage adapter](https://github.com/lazerwalker/hubot-imessage) repository.

## Getting Started

Unlike other Hubot adapters, the iMessage adapter requires you to be running Hubot on a computer running OS X 10.8 or newer. It hasn't been tested on a Hackintosh, but presumably any version of OS X with access to Messages.app should work. To reiterate: you *CANNOT* currently use the iMessage adapter on Heroku, Linux, or Windows.

First you will need to edit the `package.json` for your hubot and add the
`hubot-imessage` adapter dependency.

    "dependencies": {
      "hubot-imessage": ">= 0.0.1",
      "hubot": ">= 2.0.0",
      ...
    }

Then save the file, and commit the changes to your hubot's git repository.

## Configuring the Adapter

The iMessage adapter requires only the following environment variable.

* `HUBOT_IMESSAGE_HANDLES`

### iMessage Handles

Hubot will only accept messages from whitelisted Apple IDs. `HUBOT_IMESSAGE_HANDLES` It should be a comma-separated list of Apple IDs of the format `+15551234` for phone numbers or `E:foo@bar.com` for email addresses.
