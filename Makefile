NPM_EXECUTABLE_HOME := node_modules/.bin

PATH := ${NPM_EXECUTABLE_HOME}:${PATH}

docs:
	@./node_modules/docco/bin/docco --layout linear src/*.coffee

test: deps
	@find test -name '*_test.coffee' | xargs -n 1 -t coffee

dev: generate-js
	@coffee -wc --bare -o lib src/*.coffee

generate-js:
	@find src -name '*.coffee' | xargs coffee -c -o lib

package:
	@bin/hubot -c hubot
	@chmod 0755 hubot/bin/hubot

remove-js:
	@rm -fr lib/

deps:

.PHONY: all

