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
