NPM_EXECUTABLE_HOME := node_modules/.bin

PATH := ${NPM_EXECUTABLE_HOME}:${PATH}

test: deps
	@find test -name '*_test.coffee' | xargs -n 1 -t coffee

package:
	@bin/hubot -c hubot
	@chmod 0755 hubot/bin/hubot

deps:

.PHONY: all
