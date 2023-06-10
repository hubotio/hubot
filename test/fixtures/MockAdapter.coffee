{ Adapter } = require "../../index.js"
class MockAdapter extends Adapter
    constructor: (robot, @options) ->
        super robot
        @name = "MockAdapter"
    run: ->
        @emit "connected"

module.exports.use = (robot) ->
    new MockAdapter robot