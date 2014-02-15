User                                                                 = require './src/user'
Brain                                                                = require './src/brain'
Robot                                                                = require './src/robot'
Adapter                                                              = require './src/adapter'
Response                                                             = require './src/response'
{Listener,TextListener,EmoteListener}                                              = require './src/listener'
{TextMessage,EmoteMessage,EnterMessage,LeaveMessage,TopicMessage,CatchAllMessage} = require './src/message'

module.exports = {
  User
  Brain
  Robot
  Adapter
  Response
  Listener
  TextListener
  EmoteListener
  TextMessage
  EmoteMessage
  EnterMessage
  LeaveMessage
  TopicMessage
  CatchAllMessage
}

module.exports.loadBot = (adapterPath, adapterName, enableHttpd, botName) ->
  new Robot adapterPath, adapterName, enableHttpd, botName
