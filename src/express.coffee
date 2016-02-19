module.exports = (robot) ->
    user    = process.env.EXPRESS_USER
    pass    = process.env.EXPRESS_PASSWORD
    stat    = process.env.EXPRESS_STATIC
    port    = process.env.EXPRESS_PORT or process.env.PORT or 8080
    address = process.env.EXPRESS_BIND_ADDRESS or process.env.BIND_ADDRESS or '0.0.0.0'

    express = require 'express'
    multipart = require 'connect-multiparty'

    app = express()

    app.use (req, res, next) =>
      res.setHeader "X-Powered-By", "hubot/#{robot.name}"
      next()

    app.use express.basicAuth user, pass if user and pass
    app.use express.query()

    app.use express.json()
    app.use express.urlencoded()
    # replacement for deprecated express.multipart/connect.multipart
    # limit to 100mb, as per the old behavior
    app.use multipart(maxFilesSize: 100 * 1024 * 1024)

    app.use express.static stat if stat

    try
      robot.server = app.listen(port, address)
    catch err
      robot.logger.error "Error trying to start HTTP server: #{err}\n#{err.stack}"
      process.exit(1)

    herokuUrl = process.env.HEROKU_URL

    if herokuUrl
      herokuUrl += '/' unless /\/$/.test herokuUrl
      robot.pingIntervalId = setInterval =>
        HttpClient.create("#{herokuUrl}hubot/ping").post() (err, res, body) =>
          robot.logger.info 'keep alive ping!'
      , 5 * 60 * 1000

    app
