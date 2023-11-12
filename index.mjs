'use strict'

import User from './src/User.mjs'
import Brain from './src/Brain.mjs'
import Robot from './src/Robot.mjs'
import Adapter from './src/Adapter.mjs'
import Response from './src/Response.mjs'
import Middleware from './src/Middleware.mjs'
import { Listener, TextListener } from './src/Listener.mjs'
import { TextMessage, EnterMessage, LeaveMessage, TopicMessage, CatchAllMessage, Message } from './src/Message.mjs'
import { DataStore, DataStoreUnavailable } from './src/DataStore.mjs'

const loadBot = (adapter, enableHttpd, name, alias) => new Robot(adapter, enableHttpd, name, alias)
export {
  Adapter,
  User,
  Brain,
  Robot,
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
  Adapter,
  User,
  Brain,
  Robot,
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
