suite =

  "sanity check": (test) ->
    test.ok true, "true should be true"
    test.done()

  # "fail check": (test) ->
  #   test.ok true is false, "should fail"
  #   test.done()

module.exports = suite
