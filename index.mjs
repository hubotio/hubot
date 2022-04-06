'use strict'
import User from './src/user.mjs'
import Brain from './src/brain.mjs'
import Robot from './src/robot.mjs'
import Adapter from './src/adapter.mjs'
import Response from './src/response.mjs'
import { Listener, TextListener } from './src/listener.mjs'
import { Message, TextMessage, EnterMessage, LeaveMessage, TopicMessage, CatchAllMessage } from './src/message.mjs'
import { DataStore, DataStoreUnavailable } from './src/datastore.mjs'

const loadBot = async (adapterPath, adapterName, botName, botAlias, port) => {
  const bot = new Robot(adapterPath, adapterName, botName, botAlias, port)
  try {
    await bot.loadAdapter(`${adapterName}.mjs`)
    bot.errorHandlers = []
    bot.on('error', (err, res) => {
      return bot.invokeErrorHandlers(err, res)
    })
    bot.onUncaughtException = err => {
      return bot.emit('error', err)
    }
    process.on('uncaughtException', bot.onUncaughtException)
  } catch (err) {
    bot.logger.error(`Cannot load adapter ${adapterPath}/${adapterName} - ${err}`)
    process.exit(1)
  }
  return bot
}

export default {
  User,
  Brain,
  Robot,
  Adapter: Adapter,
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
  loadBot
}
