NPM_EXECUTABLE_HOME := node_modules/.bin

PATH := ${NPM_EXECUTABLE_HOME}:${PATH}

package:
	@bin/hubot -c hubot
	@chmod 0755 hubot/bin/hubot

.PHONY: all

