User                                                    = require './src/user'
Brain                                                   = require './src/brain'
Robot                                                   = require './src/robot'
Adapter                                                 = require './src/adapter'
Response                                                = require './src/response'
{Listener,TextListener,MessageListener}                                     = require './src/listener'
{TextMessage,EnterMessage,LeaveMessage,TopicChangeMessage,CatchAllMessage}  = require './src/message'

module.exports.loadBot = (adapterPath, adapterName, enableHttpd, botName) ->
  new Robot adapterPath, adapterName, enableHttpd, botName

module.exports.User               = User
module.exports.Brain              = Brain
module.exports.Robot              = Robot
module.exports.Adapter            = Adapter
module.exports.Response           = Response
module.exports.Listener           = Listener
module.exports.TextListener       = TextListener
module.exports.MessageListener    = MessageListener
module.exports.TextMessage        = TextMessage
module.exports.EnterMessage       = EnterMessage
module.exports.LeaveMessage       = LeaveMessage
module.exports.TopicChangeMessage = TopicChangeMessage
module.exports.CatchAllMessage    = CatchAllMessage
