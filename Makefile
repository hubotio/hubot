NPM_EXECUTABLE_HOME := node_modules/.bin

PATH := ${NPM_EXECUTABLE_HOME}:${PATH}

test: deps
	@echo ERROR: the tests are currently being reworked to be simpler

package:
	@bin/hubot -c hubot
	@chmod 0755 hubot/bin/hubot

deps:

.PHONY: all
