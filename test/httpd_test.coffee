process.env.CONNECT_STATIC = 'test/static/'
Tests = require './tests'
assert = require 'assert'
helper = Tests.helper()
require './scripts/test'

helper.adapter.cb = (msg) ->
    assert.equal 1, helper.sent.length
    assert.equal "static\n", msg
    helper.stop()

setTimeout( () ->
    helper.adapter.receive 'static'
, 100)

