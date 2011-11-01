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
