User                                                                 = require './src/user'
Brain                                                                = require './src/brain'
Robot                                                                = require './src/robot'
Adapter                                                              = require './src/adapter'
Response                                                             = require './src/response'
{Listener,TextListener}                                              = require './src/listener'
{Message,TextMessage,EnterMessage,LeaveMessage,TopicMessage,CatchAllMessage} = require './src/message'

module.exports = {
  User
  Brain
  Robot
  Adapter
  Response
  Listener
  TextListener
  Message
  TextMessage
  EnterMessage
  LeaveMessage
  TopicMessage
  CatchAllMessage
}

module.exports.loadBot = (adapterPath, adapterName, enableHttpd, botName, botAlias) ->
  new Robot adapterPath, adapterName, enableHttpd, botName, botAlias
