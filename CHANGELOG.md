[v2.16.0](https://github.com/github/hubot/tree/v2.16.0)
========

[Full Changelog](https://github.com/github/hubot/compare/v2.15.0...v2.16.0)

**Merged pull requests:**

- Update docs on keepalive support [\#1033](https://github.com/github/hubot/pull/1033) ([@bkeepers](https://github.com/bkeepers))
- Cleanup tests [\#1032](https://github.com/github/hubot/pull/1032) ([@michaelansel](https://github.com/michaelansel))
- Add coffee-errors to test scaffolding [\#1020](https://github.com/github/hubot/pull/1020) ([@bhuga](https://github.com/bhuga))
- Receive middleware [\#1019](https://github.com/github/hubot/pull/1019) ([bhuga](https://github.com/bhuga))
- Pass alias in Robot constructor. Fixes issue \#1002. [\#1003](https://github.com/github/hubot/pull/1003) ([@sdimkov](https://github.com/sdimkov))
- Add Robot.listen [\#986](https://github.com/github/hubot/pull/986) ([@michaelansel](https://github.com/michaelansel))

v2.15.0
=======

* Document another middleware pattern https://github.com/github/hubot/pull/1017
* Make Robot.respondPattern a public method https://github.com/github/hubot/pull/1011
* Make "done" argument optional for middleware https://github.com/github/hubot/pull/1028

v2.14.0
=======

* Lots of documentation tweaks and new adapters
* Added a code of conduct https://github.com/github/hubot/pull/1005
* Add Listener Middleware https://github.com/github/hubot/pull/803

v2.13.2
=======

* Minor documentation updates
* Add Robot.respondPattern private to improve testability https://github.com/github/hubot/pull/975
* Ignore .node-version so it isn't included in releases https://github.com/github/hubot/pull/980

v2.13.1
=======

* Fix documentation when running `hubot -c` to suggest correct usage of generator https://github.com/github/hubot/pull/938
* Fix respond listeners matching when robot alias is a substring of robot name https://github.com/github/hubot/pull/927
* Update bin/hubot to log a warning if called with non-existent options https://github.com/github/hubot/pull/931

v2.13.0
=======

* Fix some website links
* Link to Freenode channel (#hubot)
* Fix license in package.json
* Various documentation updates
* More automated tests
* Add support for global http options (see https://github.com/github/hubot/blob/master/docs/patterns.md#forwarding-all-http-requests-through-a-proxy for details)
* Add support for listener metadata (see https://github.com/github/hubot/blob/master/docs/scripting.md#listener-metadata) for details
* Document using npm search for finding scripts

v2.12.0
=======

* Update scripting documentation to ref to `res` instead of `msg`, since it's a `Response` object
* Update scoped-http-client from 0.10.0 to 0.10.3
* Fix deprecation warnings from connect at startup

v2.11.4
=======

* Fix shell adapter parsing history on node 0.8 (ie don't include newlines)

v2.11.3
=======

* Fix issues around shell adapter throwing errors when there isn't a .hubot_history file

v2.11.2
=======

* Add support for namespaced alternative environment variables for controlling the port and address express binds to (EXPRESS_PORT and EXPRESS_BIND_ADDRESS).

v2.11.1
=======

* Automated testing
* Cleanup uncaughtException handlers, to avoid node warning about a memory leak during tests

v2.11.0
=======

* Update scripting.md script package sample
* Include Message class in exported module (ie require 'hubot')
* Support custom options when calling `robot.http` that are passed onto the scoped-http-client
* Update scoped-http-client dependency to 0.10.0
* Fix error when loading a script that doesn't export a function; log a warning instead

v2.10.0
=======

* Add support to shell adapter for customizing the user with HUBOT_SHELL_USER_ID and HUBOT_SHELL_USER_NAME
* Add history support to shell adapter, so it remembers commands previously used

v2.9.3
======

* Allow `robot.respond` to work when there is preceding whitespace
* Update `robot.parseHelp` to be synchronous, so it's easier to test
* Reduce Heroku ping interval from 20 minutes to 5 minutes to keep hubot from going unavailable
* Make sure`robot.pingIntervalId` is kept after setting up Heroku ping  interval

v2.9.2
======

* Update express dependency to a version isn't affected by [CVE-2014-7191](http://web.nvd.nist.gov/view/vuln/detail?vulnId=CVE-2014-7191)
   * More specifically, a version of express that depends on connect that depends on qs that isn't vulnerable

v2.9.1
======

* Improve instructions for using new yeoman generator when calling `hubot --create`

v2.9.0
======

* Deprecate `hubot --create` in favor of new yeoman generator

v2.8.3
======

* Fix error when trying to find userForName, when name is incorrectly set as an integer

v2.8.2
======

* Fix error logging when not using any error handlers

v2.8.1
======

* Include link to https://github.com/hubot-scripts in addition to hubot-scripts repo
* Remove auth.coffee. https://github.com/hubot-scripts/hubot-auth is recommended instead

v2.8.0
======

* Add support for `hubot --config-check` to verify hubot will load based on how it's configured
* Include `script/` directory for convenient one-liners for common tasks of developing github/hubot
* Fixes to default `image me` and `help`
* Updated documentation about external scripts
* Add better debug output when receiving text messages

v2.7.5
======

* Fix Campfire adapter to specify a User-Agent

v2.7.4
======

* Update Campfire adapter to specify a User-Agent

v2.7.3
======

* Updated list of adapters in documentation
* Document script load order
* Support any file extension for script that node supports

v2.7.2
======

* Expose the robot adapter name as `robot.adapterName`.

v2.7.1
======

* Update error handling API to pass along `msg` object in more cases - technicalpickles


v2.7.0
======

* Support binding to a specific IP address - smerrill
* Add error handling API - technicalpickles
* Remove math.coffee since it uses a now-removed Google service - technicalpickles
* MOAR MUSTACHES - cannikin

v2.6.5
======

* Fix new bot template to get the latest version of the bot - technicalpickles

v2.6.4
======

* Fix documentation for setting up Redis on Heroku - thiagopnts
* Document script load ordering - balbeko
* Fix extra space in help messages - vanetix
* Parse 'Authors' section in script documentation - spajus
* Differentiate the different types of Campfire errors - simonsj
* Consistently load files across platform - technicalpickles
* Fix topic handler to be able to access the text of its body - wingrunr21

v2.6.3
======

* Fix issues with disabling the HTTP server - balbeko
* Add usersWithRole to auth.coffee - jhubert

v2.6.2
======

* Destructure TopicMessage in robot.coffee to fix a bug - tombell
* Update math.coffee to respond to calculator - bartolsthoorn

v2.6.1
======

* Show robot.alias in help commands if defined - technicalpickles
* Epic documentation update - technicalpickels
* Remove tweet.coffee from generated hubot-scripts.json since it has a npm dependency - tombell
* Don't load roles.coffee if using auth.coffee - tombell
* Make sure to clear interval for pinging Heroku URL - tombell
* Fix deprecation warning in youtube.coffee - timclipsham
* Fix youtube results bug - timclipsham

v2.6.0
======

* Clear ping timeout when shutting down - tombell
* Don't load roles.coffee if using auth.coffee - tombell
* Removed tweet.coffee from default hubot-scripts - tombell
* Removed Response#http deprecation warning - tombell
* Updated version range for hubot and hubot-scripts - tombell

v2.5.5
======

* Fix an issue with the version being out of sync with the version specified in
  the generated package.json

v2.5.4
======

* Add the ability for hubot to lock/unlock rooms in Campfire

v2.5.3
======
* Fix race condition in brain loading
* Fixup translate scripts for spaces in languages

v2.5.2
======

* Parse help from external script package scripts - aaronj1335
* Remove bad script header from pugme - maxgoedjen
* Fix exception when sending multiple messages - aroben
* Add 'maths' to math me regex - jacksonhull

v2.5.1
======

* Add the auth script as a default script - tombell
* Updated @userForId uses for deprecation - kch
* Fix hubot respond bug - shiwano
* Default user-agent for HTTP requests - aroben
* Fix copying executable files - brntbeer
* Fix issues with mkdirDashP - Ronald Evers

v2.5.0
======

* Add the ability to listen for topic changes - wingrunr21 and tombell
* Register default HTTP routes with robot.name - kashyapp
* Swap connect out for express - creatorr
* Brain has become more key-value store-like - creatorr
* Google Image script improvements - kyleslattery
* Help script fixes - Abraham
* Add deprecation messages to functions - tombell

v2.4.8
======

* Exit on startup for a variety of critical failures.

v2.3.4
======

* Add 'examples' and 'urls' to list of known documentation sections
* Improve mustache results - marsam in #341

v2.3.3
======

* Fix help parsing of javascript iles - ferlores in #322
* Roles will correctly semicolon-delimit the list of roles if one (or more) roles contain a comma. - futuraprime in #327
* Updated translations of supported languages as of 20120801 - sopel in #328
* Escape brackets in html view of help - tombell, technicalpickles
* More coffee-like translate.coffee - elmoeleven in #336
* Fixed reference to when npm was included w/ node - technicalpickles in #347
* Backwards-compatible help parsing, and tracking all documentation instead of just commands - technicalpickles

v2.3.2
======
* New route `/hubot/help` to display command help - tombell
* Role script fix - ferlores
* Store connect server - tombell

v2.3.0
======
* Extracted remaining classes into their own files - tombell

**Note** this is a breaking change for adapters. Adapters are going to want to
use the following code snippet for requiring classes from hubot.

    {Adapter,Robot} = require 'hubot'

* Update the formatting of documentation comments at the top of scripts - technicalpickles
* Update the parsing of the documentation comments - tombell

v2.2.0
======
* Fixed keep alive ping, requires `HEROKU_URL` - tombell and jimeh
* Updated dependency versions - tombell and jimeh

v2.1.4
======
* Hubot now keeps himself alive due to Heroku's web processes shutting down when idle - tombell
* Hubot's image search is now defaulted to safe search - kylev
* Hubot now emits a 'connected' event when he connects to the chosen adapter - sbryant

* Fix the roles.coffee not to respond to empty names - christierney

v2.1.3 - The Heat Stroke Release
================================
* Hubot now has a web interface and supports connect middleware, examples in httpd.coffee - atmos / tombell

    module.exports = (robot) ->
      robot.router.get "/hubot/version", (req, res) ->
        res.end robot.version

* Add a catchAll callback that handles responses that match nothing else - titanous / ejfinnerman

    module.exports = (robot) ->
      robot.catchAll (msg) ->
        router.get "/hubot/version", (req, res) ->

v2.1.2
======
* Update behaviour of finishing further execution of listeners
* Scripts are now loaded in the following order
  * Scripts defined in `./hubot-scripts.json` are loaded in order
  * Scripts are loaded alphabetically from `/scripts`

v2.1.1
======
* The hwhoops release, finish/done behavior is handled elsewhere

v2.1.0
======
* Introduce Response.finish() to indicate that a message should not be passed on to any other listeners
* Scripts are evaluated in the following order
  * `./scripts` is loaded alphabetically
  * The contents of `./hubot-scripts.json` is loaded in order

    module.exports = (robot) ->
      robot.respond /\s*yo\s*\\?/i, (msg) ->
        msg.reply "Yo!"
        msg.finish()

v2.0.7
======
* Update topic and logger scoping fixups - Horace Ko
* Don't exit the process if listening to a room is denied

v2.0.6
======
* Don't kill all username looks if some users don't have name attribute

v2.0.5
======
* All adapters have been removed except for shell and campfire
* Better win32 compatability
* Campfire reconnects on streaming errors on a per-room basis

v2.0.0
======
* Major adapter overhaul, they're now external - Tom Bell
* Shell adapter now functions like a REPL - Tom Bell
* Improved logging using log.js - Tom Bell
* Search help commands - Gabriel Horner
* Improvements to roles.coffee - Daniel Schauenberg

Upgrading
---------
If you are not using the Campfire or Shell adapters please be aware before
upgrading that adapters have been moved out of the code of hubot and you should
install the hubot adapters from npm when people make them available. Until your
adapter is available you may wish to remain on v1.1.11.

v1.1.11
=======
* support self-signed SSL certs for IRC - Ville Lautanala <lautis@gmail.com>
* twilio adapter fixups - Tom Bell
* XMPP adapter fixups - Patrik Votocek <patrik@votocek.cz>
* Everyone gets a pug - Jon Maddox <jon@jonmaddox.com>
* Accept contact list requests - Arlo Carreon <arlo.carreon@gmail.com>
* Google talk whitelisting support - pescuma <pescuma@chaordicsystems.com>

v1.1.10
=======
* Fix optparse problems on certain linuxes
* IRC adapter fixups for users - Andrew Nordman <cadwallion@gmail.com>
* Bump npm irc depedency - BrokenEnso <ericday96@gmail.com>
* accept invites on IRC - Dingding Ye <yedingding@gmail.com>
* Support talkerapp style @replies - Charles Barbier <unixcharles@gmail.com>
* Set hubot's google talk status properly - Matt McCormick <mbmccormick@gmail.com>

v1.1.9
======
* Add a google talk adapter - Arlo Carreon <arlo.carreon@gmail.com>

v1.1.8
======
* Fix a bug in robot.respond that allowed regexes to be constructed that
  could be triggered without prefixing with the robot's name - atmos
* Fixup rarely triggered response stuff that uses an undefined variable

v1.1.7
======
* Fix username issues where campfire names weren't updated - atmos
* Allow help files to parse from raw js - Jason Ford <jason@jason-ford.com>
* Talkerapp bug fix ups - Charles Barbier <unixcharles@gmail.com>, Magnus Bergmark <magnus.bergmark@gmail.com>
* Preserve ordering in campfire message sending - Sean Cribbs <sean@basho.com>
* Flowdock adapter - Arttu Tervo <arttu.tervo@nodeta.fi>


v1.1.5
======
* Add a talkerapp adapter - Victor Castell <victorcoder@gmail.com>
* Add a twitter adapter - Mathilde Lemee <mathilde.lemee@yahoo.fr>
* Emit a loaded event in mergeData - codec <codec@fnord.cx>

v1.1.2
======
* Fix the optparse npm install anomaly

v1.1.1
======
* Fix campfire adapter getting duplicate messages - atmos

v1.1.0
======

* Explicity errors for misconfigured campfire setup - Damien Mathieu <damien.mathieu@shazino.com>
* Support '-v' as a CLI opt to display version - Damien Mathieu <damien.mathieu@shazino.com>
* Tons of fixups to the hipchat adapter - Codafoo <cesar@webzense.net>, Assaf Arkin <assaf@labnotes.org>
* Various IRC adapter fixups - Mark Paschal <markpasc@markpasc.org>, Jesse Szwedko
* Enter/Leave events for adapters - Brian Donovan <me@brian-donovan.com>
* XMPP adapter fixups - codec <codec@fnord.cx>,
* Break out persistence layer to make it easier to have multiple backends - technoweenie
* Various refactorings/cleanups - Tom Bell <tomb@tombell.org.uk>
* translation script enhancements - OiNutter <willmckenzie@oinutter.co.uk>
* XMPP user persistence fixups - Andy Fowler <andy@andyfowler.com>

Upgrading
---------
If you're using the redis persistence you're going to need to enable
'redis-brain.coffee' in your hubot-scripts.json file.  It was moved
there and the brain now supports events allowing you to use any
persistence backend you want.

v1.0.5
======

* Remove infinite loop script to keep things alive - atmos

v1.0.4
======

* HipChat adapter support - Assaf Arkin <assaf@labnotes.org>
* XMPP adapter support - Andy Fowler <andy@andyfowler.com>
* Twilio adapter fixups - Jesse Newland <jesse@jnewland.com>
* Fixup hubot-scripts.json template examples - Mike Skalnik <mike.skalnik@gmail.com>

v1.0.3
======

* Fix IRC adapter replies - Scott Moak <scott.moak@gmail.com>
* Ensure people are running node 0.4.x - Corey Donohoe <atmos@atmos.org>
* Doc fixups - Aitor García Rey <aitor@linkingpaths.com>
* Twilio adapter support - Tom Bell <tomb@tombell.org.uk>
