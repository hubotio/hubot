## Installing dependencies
First, we'll install all of the dependencies necessary to get Hubot up and running. This tutorial is written for Ubuntu, so we'll be using apt-get.

``` cli
apt-get install build-essential libssl-dev git-core redis-server libexpat1-dev
```

If you're using Yellowdog Updater Modified (`yum`), do this:

```cli
yum install openssl openssl-devel openssl-static crypto-utils expat expat-devel git
```

Now, download, extract, and install Node.js:

``` cli
wget http://nodejs.org/dist/v0.8.17/node-v0.8.17.tar.gz
tar xf node-v0.8.17.tar.gz -C /usr/local/src && cd /usr/local/src/node-v0.8.17
./configure && make && make install
```

And use NPM to install CoffeeScript:

``` cli
# npm install -g coffee-script
```

## Installing Hubot
We'll be installing Hubot to /opt, but any directory should work.

``` cli
# cd /opt
# git clone git://github.com/github/hubot.git && cd hubot
# npm install
```

And that's pretty much it for the install. See the next sections for more information on getting Hubot started.

## Running Hubot
In order to run Hubot, you may need to export some environment variables for your adapter. See [the rest of the wiki](https://github.com/github/hubot/wiki) for more information. For example, to use the Campfire adapter, we would export the following values:

``` bash
export HUBOT_CAMPFIRE_ACCOUNT="Campfire Account Subdomain"
export HUBOT_CAMPFIRE_TOKEN="API Token for Hubot user"
export HUBOT_CAMPFIRE_ROOMS="room,ids,separated,by,commas"
```

Now we can start Hubot:

``` cli
# /opt/hubot/bin/hubot --name mcfly --adapter campfire
```
### Hubot init script
For extra credit, you can use this upstart script to quickly daemonize Hubot. It will export the necessary environment variables and automatically restart Hubot in the event of failure. This version is written with the Campfire adapter in mind, and for proper use with upstart it should be stored in **/etc/init/hubot.conf**. ([A similar script was created for CentOS 6](https://github.com/parkr/centos-bootstrap/blob/master/support/hubot.conf)).

``` upstart
# hubot

description "Hubot Campfire bot"

start on filesystem or runlevel [2345]
stop on runlevel [!2345]

# Path to Hubot installation
env HUBOT_DIR='/opt/hubot/'
env HUBOT='bin/hubot'
env ADAPTER='campfire'
# Name (and local user) to run Hubot as
env HUBOT_USER='mcfly'
# httpd listen port
env PORT='5555'

# Campfire-specific environment variables
env HUBOT_CAMPFIRE_TOKEN=''
env HUBOT_CAMPFIRE_ACCOUNT=''
env HUBOT_CAMPFIRE_ROOMS=''

# Keep the process alive, limit to 5 restarts in 60s
respawn
respawn limit 5 60

exec start-stop-daemon --start --chuid ${HUBOT_USER} --chdir ${HUBOT_DIR} \
  --exec ${HUBOT_DIR}${HUBOT} -- --name ${HUBOT_USER} --adapter ${ADAPTER}  >> /var/log/hubot.log 2>&1
```

Be sure to add the user specified by **$HUBOT_USER**. In this example, we would run `useradd -s /bin/false mcfly`. From there, you can start Hubot by running `start hubot` from the command-line.

***
If you wish to install a deployable version of Hubot with a working IRC adaptor on a clean install of Centos:

``` bash
yum -y install expat-devel
git clone https://github.com/github/hubot.git
cd hubot
npm install
./bin/hubot -c <destination directory>
cd <destination directory>
```

edit package.json and add this line to the dependencies section:

``` cli
     "hubot-irc": ">= 0.0.6",
```
Then finish building the working hubot as follows:

``` bash
npm update
edit hubot-scripts.json and remove redis.coffee entry if you do not run redis locally.
chmod +x bin/hubot
Finally set all the environment variables:
export HUBOT_IRC_ROOMS="#debug"
export HUBOT_IRC_SERVER="<your server>"
export HUBOT_IRC_PASSWORD="<password>"
export HUBOT_LOG_LEVEL="debug"  # This helps to see what Hubot is doing
export HUBOT_IRC_DEBUG="true"
# Finally run:
./bin/hubot -a irc
```

Voila!  Hubot is now in your IRC channel and will respond appropriately.  You may also package up <destination directory> and create an RPM for easy deployment elsewhere.
