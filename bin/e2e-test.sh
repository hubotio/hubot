#!/bin/bash
HUBOT_FOLDER=$(pwd)
TEMP_ROOT=$(mktemp -d)

echo "$ pushd $TEMP_ROOT"
pushd $TEMP_ROOT
trap "{ CODE=$?; popd; rm -rf $TEMP_ROOT; exit $CODE; }" EXIT

## https://github.com/hubotio/hubot/blob/main/docs/index.md

## use hubot from last commit
echo "$ create hubot in $TEMP_ROOT"
pwd
npm init -y
npm i $HUBOT_FOLDER/. coffeescript

./node_modules/.bin/hubot --create myhubot
cd myhubot

# npm install /path/to/hubot will create a symlink in npm 5+ (http://blog.npmjs.org/post/161081169345/v500).
# As the require calls for app-specific scripts happen inside hubot, we have to
# set NODE_PATH to the app’s node_modules path so they can be found
echo "$ Update NODE_PATH=$TEMP_ROOT/node_modules so everything can be found correctly."
export NODE_PATH=$TEMP_ROOT/node_modules:$TEMP_ROOT/myhubot/node_modules
export PATH=$PATH:$TEMP_ROOT/node_modules/.bin:$TEMP_ROOT/myhubot/node_modules/.bin
export HUBOT_INSTALLATION_PATH=$HUBOT_FOLDER/.
echo $HUBOT_INSTALLATION_PATH

## start, but have to sleep 1 second to wait for hubot to start and the scripts to load
expect <<EOL
  set timeout 30
  spawn hubot --name e2etest
  expect "e2etest> "
  sleep 1
  send "e2etest PING\r"
  expect {
    "PONG" {}
    timeout {exit 1}
  }
EOL
