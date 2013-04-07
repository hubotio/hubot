spawn = require('child_process').spawn

module.exports = (robot) ->

  robot.router.get "/#{robot.name}/version", (req, res) ->
    res.end robot.version

  robot.router.post "/#{robot.name}/ping", (req, res) ->
    res.end "PONG"

  robot.router.get "/#{robot.name}/time", (req, res) ->
    res.end "Server time is: #{new Date()}"

  robot.router.get "/#{robot.name}/info", (req, res) ->
    child = spawn('/bin/sh', ['-c', "echo I\\'m $LOGNAME@$(hostname):$(pwd) \\($(git rev-parse HEAD)\\)"])

    child.stdout.on 'data', (data) ->
      res.end "#{data.toString().trim()} running node #{process.version} [pid: #{process.pid}]"
      child.stdin.end()

  robot.router.get "/#{robot.name}/ip", (req, res) ->
    robot.http('http://ifconfig.me/ip').get() (err, r, body) ->
      res.end body
