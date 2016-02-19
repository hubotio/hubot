HttpClient = require 'scoped-http-client'

module.exports = (robot) ->
  # Public: Creates a scoped http client with chainable methods for
  # modifying the request. This doesn't actually make a request though.
  # Once your request is assembled, you can call `get()`/`post()`/etc to
  # send the request.
  #
  # url - String URL to access.
  # options - Optional options to pass on to the client
  #
  # Examples:
  #
  #     robot.http("http://example.com")
  #       # set a single header
  #       .header('Authorization', 'bearer abcdef')
  #
  #       # set multiple headers
  #       .headers(Authorization: 'bearer abcdef', Accept: 'application/json')
  #
  #       # add URI query parameters
  #       .query(a: 1, b: 'foo & bar')
  #
  #       # make the actual request
  #       .get() (err, res, body) ->
  #         console.log body
  #
  #       # or, you can POST data
  #       .post(data) (err, res, body) ->
  #         console.log body
  #
  #    # Can also set options
  #    robot.http("https://example.com", {rejectUnauthorized: false})
  #
  # Returns a ScopedClient instance.
  return (url, options) ->
    HttpClient.create(url, @extend({}, @globalHttpOptions, options))
      .header('User-Agent', "Hubot/#{robot.version}")
