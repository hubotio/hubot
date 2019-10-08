const {RTMClient, WebClient} = require('@slack/client')
const SlackFormatter = require('./slack-formatter.js')

const CONVERSATION_CACHE_TTL_MS = process.env.HUBOT_SLACK_CONVERSATION_CACHE_TTL_MS
  ? parseInt(process.env.HUBOT_SLACK_CONVERSATION_CACHE_TTL_MS, 10) : (5 * 60 * 1000)
const PAGE_SIZE = 100

class SlackClient {
  constructor (options, robot) {
    this.robot = robot
    this.rtm = new RTMClient(options.token, options.rtm)
    this.web = new WebClient(options.token, { maxRequestConcurrency: 1 })
    this.robot.logger.debug(`RTMClient initialized with options: ${JSON.stringify(options.rtm)}`)
    this.rtmStartOpts = options.rtmStart || {}
    this.format = new SlackFormatter(this.rtm.dataStore, this.robot)
    this.botUserIdMap = {
      'B01': { id: 'B01', user_id: 'USLACKBOT' }
    }
    this.channelData = {}
    this.rtm.on('message', this.eventWrapper, this)
    this.rtm.on('reaction_added', this.eventWrapper, this)
    this.rtm.on('reaction_removed', this.eventWrapper, this)
    this.rtm.on('presence_change', this.eventWrapper, this)
    this.rtm.on('member_joined_channel', this.eventWrapper, this)
    this.rtm.on('member_left_channel', this.eventWrapper, this)
    this.rtm.on('file_shared', this.eventWrapper, this)
    this.rtm.on('user_change', this.updateUserInBrain, this)
    this.eventHandler = undefined
  }
  connect () {
    this.robot.logger.debug(`RTMClient#start() with options: ${JSON.stringify(this.rtmStartOpts)}`)
    return this.rtm.start(this.rtmStartOpts)
  }
  onEvent (callback) {
    this.eventHandler = callback
  }
  disconnect () {
    this.rtm.disconnect()
    return this.rtm.removeAllListeners()
  }
  setTopic (conversationId, topic) {
    this.robot.logger.debug(`SlackClient#setTopic() with topic ${topic}`)
    return this.web.conversations.info({channel: conversationId})
      .then(res => {
        const conversation = res.channel
        if (!conversation.is_im && !conversation.is_mpim) {
          return this.web.conversations.setTopic({channel: conversationId, topic})
        } else {
          return this.robot.logger.debug(`Conversation ${conversationId} is a DM or MPDM. These conversation types do not have topics.`
          )
        }
      }).catch(error => {
        return this.robot.logger.error(`Error setting topic in conversation ${conversationId}: ${error.message}`)
      })
  }
  async send (envelope, message) {
    const room = envelope.room || envelope.id
    if ((room == null)) {
      this.robot.logger.error('Cannot send message without a valid room. Envelopes should contain a room property set to a Slack conversation ID.')
      return
    }

    this.robot.logger.debug(`SlackClient#send() room: ${room}, message: ${message}`)

    const options = {
      as_user: true,
      link_names: 1,
      thread_ts: (envelope.message != null ? envelope.message.thread_ts : undefined)
    }

    if (typeof (message) !== 'string') {
      message.channel = message.channel || room
    } else {
      options.text = message
      options.channel = room
    }

    let result = null
    try {
      result = await this.web.chat.postMessage(Object.assign(message, options))
    } catch (error) {
      this.robot.logger.error(`SlackClient#send() error: ${error.message}`)
    }
    return result
  }

  loadUsers (callback) {
    const combinedResults = { members: [] }
    const pageLoaded = (error, results) => {
      if (error) {
        return callback(error)
      }
      results.members.forEach(member => {
        combinedResults.members.push(member)
      })
      if (results && results.response_metadata && results.response_metadata.next_cursor) {
        return this.web.users.list({
          limit: PAGE_SIZE,
          cursor: results.response_metadata.next_cursor
        }, pageLoaded)
      } else {
        return callback(null, combinedResults)
      }
    }
    return this.web.users.list({ limit: PAGE_SIZE }, pageLoaded)
  }
  fetchUser (userId) {
    if (this.robot.brain.data.users[userId] != null) {
      return Promise.resolve(this.robot.brain.data.users[userId])
    }
    return this.web.users.info({user: userId}).then(r => this.updateUserInBrain(r.user))
  }
  fetchBotUser (botId) {
    if (this.botUserIdMap[botId] != null) { return Promise.resolve(this.botUserIdMap[botId]) }
    return this.web.bots.info({bot: botId}).then(r => r.bot)
  }
  fetchConversation (conversationId) {
    const expiration = Date.now() - CONVERSATION_CACHE_TTL_MS

    if (((this.channelData[conversationId] != null ? this.channelData[conversationId].channel : undefined) != null) &&
      (expiration < (this.channelData[conversationId] != null ? this.channelData[conversationId].updated : undefined))) { return Promise.resolve(this.channelData[conversationId].channel) }

    if (this.channelData[conversationId] != null) { delete this.channelData[conversationId] }

    return this.web.conversations.info({channel: conversationId}).then(r => {
      if (r.channel != null) {
        this.channelData[conversationId] = {
          channel: r.channel,
          updated: Date.now()
        }
      }
      return r.channel
    })
  }
  updateUserInBrain (eventOrUser) {
    let key, value
    const user = eventOrUser.type === 'user_change' ? eventOrUser.user : eventOrUser
    const newUser = {
      id: user.id,
      name: user.name,
      real_name: user.real_name,
      slack: {}
    }

    if ((user.profile != null ? user.profile.email : undefined) != null) { newUser.email_address = user.profile.email }
    for (key in user) {
      value = user[key]
      newUser.slack[key] = value
    }

    if (user.id in this.robot.brain.data.users) {
      for (key in this.robot.brain.data.users[user.id]) {
        value = this.robot.brain.data.users[user.id][key]
        if (!(key in newUser)) {
          newUser[key] = value
        }
      }
    }

    delete this.robot.brain.data.users[user.id]
    return this.robot.brain.userForId(user.id, newUser)
  }
  async eventWrapper (event) {
    if (this.eventHandler) {
      const fetches = {}
      if (event.user) {
        fetches.user = await this.fetchUser(event.user)
      }

      if (event.bot_id) {
        fetches.bot = await this.fetchBotUser(event.bot_id)
      }

      if (event.item_user) {
        fetches.item_user = await this.fetchUser(event.item_user)
      }

      if (fetches.item_user) {
        event.item_user = fetches.item_user
      }

      if (fetches.user) {
        event.user = fetches.user
      } else if (fetches.bot) {
        if (this.botUserIdMap[event.bot_id]) {
          event.user = fetches.bot
        } else if (fetches.bot.user_id != null) {
          let res = await this.web.users.info({user: fetches.bot.user_id})
          event.user = res.user
          this.botUserIdMap[event.bot_id] = res.user
        } else {
          this.botUserIdMap[event.bot_id] = false
          event.user = {}
        }
      } else {
        event.user = {}
      }

      let result = null
      try {
        result = this.eventHandler(event)
      } catch (error) {
        this.robot.logger.error(`An error occurred while processing an RTM event: ${error.message}.`, error)
      }
      return result
    }
  }
}

if (isNaN(CONVERSATION_CACHE_TTL_MS)) {
  throw new Error('HUBOT_SLACK_CONVERSATION_CACHE_TTL_MS must be a number. It could not be parsed.')
}

module.exports = SlackClient
