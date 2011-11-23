Tests  = require './tests'
assert = require 'assert'
helper = Tests.helper()
require('../src/scripts/rules') helper

tests = [
  'helper: the rules'
]

until tests.length == 0
  helper.reset()
  msg = tests.shift()
  helper.adapter.receive msg
  assert.ok helper.sent[0].match /1\. A robot may not .+/

helper.stop()
