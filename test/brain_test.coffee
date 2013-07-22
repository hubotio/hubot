assert = require 'assert'
Tests = require './tests'
helper = Tests.helper()
Brain  = require '../src/brain'

saved   = false
closing = false
closed  = false

brain = new Brain(helper)

brain.on 'save', (data) ->
  is_closing = closing
  saved = closing = true
  brain.close() if !is_closing
  assert.equal 1, data.abc

brain.on 'close', ->
  closed = true

process.on 'exit', ->
  assert.ok saved
  assert.ok closed

brain.data.abc = 1
brain.save()
helper.stop()
