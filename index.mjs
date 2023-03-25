'use strict'
import User from './src/user.mjs'
import Brain from './src/brain.mjs'
import Robot from './src/robot.mjs'
import Adapter from './src/adapter.mjs'
import Response from './src/response.mjs'
import { Listener, TextListener } from './src/listener.mjs'
import { Message, TextMessage, EnterMessage, LeaveMessage, TopicMessage, CatchAllMessage } from './src/message.mjs'
import { DataStore, DataStoreUnavailable } from './src/datastore.mjs'
import Middleware from './src/middleware.mjs'

const loadBot = async (adapter, botName, botAlias, options) => {
  const bot = new Robot(adapter, botName, botAlias, options)
  try {
    await bot.loadAdapter(adapter)
    console.log('adapter', adapter)
    bot.errorHandlers = []
    bot.on('error', (err, res) => {
      return bot.invokeErrorHandlers(err, res)
    })
    bot.onUncaughtException = err => {
      return bot.emit('error', err)
    }
    process.on('uncaughtException', bot.onUncaughtException)
  } catch (err) {
    bot.logger.error(`Cannot load adapter ${adapter} - ${err}`)
    process.exit(1)
  }
  return bot
}

export {
  User,
  Brain,
  Robot,
  Adapter,
  Response,
  Listener,
  TextListener,
  Message,
  TextMessage,
  EnterMessage,
  LeaveMessage,
  TopicMessage,
  CatchAllMessage,
  DataStore,
  DataStoreUnavailable,
  Middleware,
  loadBot
}
export default {
  loadBot
}
