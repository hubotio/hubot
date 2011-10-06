Robot = require '../src/robot'
Path  = require 'path'

Hubot = require("../src/hubot/email").Email

scriptsPath = Path.resolve "./src/hubot/scripts"

robot = new Hubot scriptsPath, 'Hewbot'

robot.load scriptsPath

robot.run()
