#!/bin/bash
BOTFORGE_FOLDER=$(pwd)
TEMP_ROOT=$(mktemp -d)

echo "$ pushd $TEMP_ROOT"
pushd $TEMP_ROOT
trap "{ CODE=$?; popd; rm -rf $TEMP_ROOT; exit $CODE; }" EXIT

## https://hubot.github.com/docs/

echo "$ npm install -g yo generator-botforge"
npm install -g yo generator-botforge

## simulate pressing enter for each generator question to accept defaults
## https://stackoverflow.com/a/6264618/206879
echo "$ yo botforge --defaults"
yo botforge --defaults

## use botforge from last commit
echo "$ npm install $BOTFORGE_FOLDER"
npm install $BOTFORGE_FOLDER

# npm install /path/to/botforge will create a symlink in npm 5+ (http://blog.npmjs.org/post/161081169345/v500).
# As the require calls for app-specific scripts happen inside botforge, we have to
# set NODE_PATH to the app’s node_modules path so they can be found
echo "$ NODE_PATH=$BOTFORGE_FOLDER/node_modules:$TEMP_ROOT/node_modules"
export NODE_PATH=$NODE_PATH/$BOTFORGE_FOLDER/node_modules:$TEMP_ROOT/node_modules

## start
expect <<EOL
  set timeout 30

  spawn bin/botforge --name e2etest

  # workaround for current botforge which does not show prompt until pressed enter
  # so we simulate it once 'INFO botforge-redis-brain: Using default redis on localhost:6379' appears
  expect "localhost:6379"
  send "\r"

  expect "e2etest> "

  send "e2etest ping\r"
  expect {
    "PONG" {}
    timeout {exit 1}
  }
EOL
