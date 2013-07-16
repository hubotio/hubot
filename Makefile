NPM_EXECUTABLE_HOME := node_modules/.bin

PATH := ${NPM_EXECUTABLE_HOME}:${PATH}

test: deps
	@./node_modules/nodeunit/bin/nodeunit --reporter minimal test

package:
	@bin/hubot -c hubot
	@chmod 0755 hubot/bin/hubot

deps:

.PHONY: all
