# A simple interaction with the built in HTTP Daemon
spawn = require('child_process').spawn

module.exports = (robot) ->
  robot.router.get "/hubot/version", (req, res) ->
    res.end robot.version
  robot.router.post "/hubot/ping", (req, res) ->
    res.end "PONG"
  robot.router.get "/hubot/time", (req, res) ->
    res.end "Server time is: #{new Date()}"
  robot.router.get "/hubot/info", (req, res) ->
    child = spawn('/bin/sh', ['-c', "echo I\\'m $LOGNAME@$(hostname):$(pwd) \\($(git rev-parse HEAD)\\)"])

    child.stdout.on 'data', (data) ->
      res.end "#{data.toString().trim()} running node #{process.version} [pid: #{process.pid}]"
      child.stdin.end()
