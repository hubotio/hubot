User                                                    = require './src/user'
Brain                                                   = require './src/brain'
Robot                                                   = require './src/robot'
Adapter                                                 = require './src/adapter'
Response                                                = require './src/response'
{Listener,TextListener}                                 = require './src/listener'
{TextMessage,EnterMessage,LeaveMessage,CatchAllMessage} = require './src/message'

module.exports.loadBot = (adapterPath, adapterName, enableHttpd, botName) ->
  robot = require './src/robot'
  new robot adapterPath, adapterName, enableHttpd, botName

module.exports.User            = User
module.exports.Brain           = Brain
module.exports.Robot           = Robot
module.exports.Adapter         = Adapter
module.exports.Response        = Response
module.exports.Listener        = Listener
module.exports.TextListener    = TextListener
module.exports.TextMessage     = TextMessage
module.exports.EnterMessage    = EnterMessage
module.exports.LeaveMessage    = LeaveMessage
module.exports.CatchAllMessage = CatchAllMessage
