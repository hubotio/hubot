#!/bin/bash
HUBOT_FOLDER=$(pwd)
TEMP_ROOT=$(mktemp -d)

echo "$ pushd $TEMP_ROOT"
pushd $TEMP_ROOT
trap "{ CODE=$?; popd; rm -rf $TEMP_ROOT; exit $CODE; }" EXIT

## https://github.com/hubotio/hubot/blob/main/docs/index.md

## use hubot from last commit
echo "$ npm install $HUBOT_FOLDER"
npm install $HUBOT_FOLDER coffeescript hubot-diagnostics
cat <<EOF > external-scripts.json
["hubot-diagnostics"]
EOF

mkdir -p $TEMP_ROOT/scripts
cp $HUBOT_FOLDER/test/fixtures/TestScript.mjs $TEMP_ROOT/scripts/

# npm install /path/to/hubot will create a symlink in npm 5+ (http://blog.npmjs.org/post/161081169345/v500).
# As the require calls for app-specific scripts happen inside hubot, we have to
# set NODE_PATH to the app’s node_modules path so they can be found
echo "$ NODE_PATH=$HUBOT_FOLDER/node_modules:$TEMP_ROOT/node_modules"
export NODE_PATH=$NODE_PATH/$HUBOT_FOLDER/node_modules:$TEMP_ROOT/node_modules
export PATH=$PATH:$TEMP_ROOT/node_modules/.bin

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
