Tests  = require './tests'
assert = require 'assert'
helper = Tests.helper()
require('../src/scripts/rules') helper

tests = [
  (helper) ->
    helper.adapter.receive 'helper: the rules'
    assert.ok helper.sent[0].match /1\. A robot may not .+/
]

until tests.length == 0
  helper.sent = []
  test = tests.shift()
  test(helper)

helper.stop()
