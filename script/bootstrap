#!/bin/bash

# Make sure everything is development forever
export NODE_ENV=development

# Load environment specific environment variables
if [ -f .env ]; then 
  source .env
fi

if [ -f .env.${NODE_ENV} ]; then
  source .env.${NODE_ENV}
fi

npm install

# Make sure coffee and mocha are on the path
export PATH="node_modules/.bin:$PATH"
