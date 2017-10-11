'use strict'

const deprecate = require('depd')('hubot')

const User = require('./src/user')
const Brain = require('./src/brain')
const Robot = require('./src/robot')
const Adapter = require('./src/adapter')
const Response = require('./src/response')
const Listener = require('./src/listener')
const Message = require('./src/message')

module.exports = {
  User,
  Brain,
  Robot,
  Adapter: Adapter,
  Response,
  Listener: Listener.Listener,
  TextListener: Listener.TextListener,
  Message: Message.Message,
  TextMessage: Message.TextMessage,
  EnterMessage: Message.EnterMessage,
  LeaveMessage: Message.LeaveMessage,
  TopicMessage: Message.TopicMessage,
  CatchAllMessage: Message.CatchAllMessage,

  loadBot (adapterPath, adapterName, enableHttpd, botName, botAlias) {
    deprecate('use Hubot.Robot constructor directly instead of Hubot.loadBot')

    return new module.exports.Robot({adapter: adapterName, httpd: enableHttpd, name: botName, alias: botAlias})
  }
}
